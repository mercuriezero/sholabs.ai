from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import asyncio
import logging
import ipaddress
import uuid
import httpx
import bcrypt
import jwt
import razorpay
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "High On AI")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL") or None
SITE_URL = os.environ.get("SITE_URL", "")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

rzp_client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), os.environ.get("RAZORPAY_KEY_SECRET", "")))


# ---------- Models ----------
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    source: str = "hero_prompt"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    source: str = "hero_prompt"


class Plan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str = ""
    prompt: str
    url: str = ""
    plan: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class LoginInput(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class OrderInput(BaseModel):
    amount_rupees: float = Field(gt=0, le=1000000)
    package_name: str = Field(default="", max_length=80)


class VerifyInput(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie("access_token", create_access_token(user_id, email),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    user.pop("password_hash", None)
                    return user
    access = request.cookies.get("access_token")
    if access:
        try:
            payload = jwt.decode(access, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") == "access":
                user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
                if user:
                    user.pop("password_hash", None)
                    return user
        except jwt.InvalidTokenError:
            pass
    raise HTTPException(status_code=401, detail="Not authenticated")


# ---------- Email guardrail gate (G2/G3 structural checks) ---
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


async def notify_owner(lead: Lead):
    try:
        subject = "New growth brief — High On AI"
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#111">'
            '<h2 style="margin:0 0 12px">New growth brief received</h2>'
            f'<p style="margin:0 0 8px"><strong>Brief:</strong> {escape(lead.prompt)}</p>'
            f'<p style="margin:0 0 8px"><strong>Source:</strong> {escape(lead.source)}</p>'
            f'<p style="margin:0 0 16px"><strong>Time (UTC):</strong> {escape(lead.created_at.isoformat())}</p>'
            f'<p style="margin:0"><a href="{escape(SITE_URL)}/dashboard">Open the command center</a></p>'
            f'<p style="font-size:12px;color:#888;margin-top:24px">Sent by {escape(EMAIL_FROM_NAME)} · instant lead alert</p>'
            '</td></tr></table>'
        )
        await send_email(to=OWNER_EMAIL, subject=subject, html=html)
    except Exception:
        logger.exception("Owner notification failed")


async def notify_owner_payment(*, name: str, email: str, amount_paise: int, package_name: str, payment_id: str):
    if not OWNER_EMAIL or not EMAIL_KEY:
        return
    try:
        amount = f"₹{amount_paise / 100:,.0f}"
        subject = f"Payment received — {amount} · {name or email}"
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#111">'
            '<h2 style="margin:0 0 12px">Payment received</h2>'
            f'<p style="margin:0 0 8px"><strong>Amount:</strong> {escape(amount)} INR</p>'
            f'<p style="margin:0 0 8px"><strong>Customer:</strong> {escape(name or "")} ({escape(email)})</p>'
            f'<p style="margin:0 0 8px"><strong>Package:</strong> {escape(package_name or "Custom amount")}</p>'
            f'<p style="margin:0 0 16px"><strong>Payment ID:</strong> {escape(payment_id)}</p>'
            f'<p style="margin:0"><a href="{escape(SITE_URL)}/dashboard">Open the command center</a></p>'
            f'<p style="font-size:12px;color:#888;margin-top:24px">Sent by {escape(EMAIL_FROM_NAME)} · instant payment alert</p>'
            '</td></tr></table>'
        )
        await send_email(to=OWNER_EMAIL, subject=subject, html=html)
    except Exception:
        logger.exception("Owner payment alert failed")


async def send_receipt(*, to: str, name: str, amount_paise: int, package_name: str, payment_id: str):
    try:
        amount = f"₹{amount_paise / 100:,.0f}"
        subject = f"Payment received — {amount} · High On AI"
        stripe = "".join(
            f'<td style="background:{c};height:6px;font-size:0">&nbsp;</td>'
            for c in ["#FFD900", "#2BBCC4", "#1FA84A", "#E200C4", "#ED1C24", "#2B39D1", "#F7941E", "#91268F"]
        )
        pkg = f'<p style="margin:0 0 8px"><strong>Package:</strong> {escape(package_name)}</p>' if package_name else ""
        greeting = f"Hi {escape(name)}," if name else "Hi,"
        html = (
            '<table role="presentation" width="100%" style="border-collapse:collapse">'
            f'<tr>{stripe}</tr>'
            '<tr><td style="padding:32px 24px;font-family:Arial,sans-serif;color:#111">'
            '<h2 style="margin:0 0 4px">Payment received</h2>'
            f'<p style="margin:0 0 20px;color:#555">{greeting} thank you — your payment is confirmed.</p>'
            f'<p style="margin:0 0 8px;font-size:28px"><strong>{escape(amount)}</strong> <span style="color:#555;font-size:14px">INR</span></p>'
            f'{pkg}'
            f'<p style="margin:0 0 8px"><strong>Payment ID:</strong> {escape(payment_id)}</p>'
            f'<p style="margin:0 0 20px"><strong>Date (UTC):</strong> {escape(datetime.now(timezone.utc).isoformat())}</p>'
            '<p style="margin:0 0 20px;color:#555">What happens next: our growth team reviews your brief and reaches out within 24 hours to kick off.</p>'
            f'<p style="margin:0"><a href="{escape(SITE_URL)}">High On AI</a> · Human intelligence + AI for marketing, sales &amp; growth</p>'
            f'<p style="font-size:12px;color:#888;margin-top:24px">Sent by {escape(EMAIL_FROM_NAME)} · QuantumAI OS Pvt Ltd · This is your payment receipt.</p>'
            '</td></tr></table>'
        )
        await send_email(to=to, subject=subject, html=html)
    except Exception:
        logger.exception("Receipt email failed")


# ---------- Instant plan agent ----------
URL_RE = re.compile(r"(https?://[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?)", re.I)

SYSTEM_PROMPT = """You are the High On AI strategy engine — a senior growth strategist for an AI-powered marketing agency.
Given a visitor's website and/or growth goal, produce an instant, concise growth plan.
Rules:
- Plain text with markdown formatting only: '## ' section headings and '- ' bullets. No tables, no code blocks, no links.
- Structure: one short opening line naming the single biggest opportunity. Then '## Get Cited (GEO)', '## Get Watched (AI Video)', '## Get Chosen (Outbound & Voice)' — each with 3 sharp, specific bullet actions. Then '## First 2 Weeks' with 2-3 bullets.
- Tailor everything to the website content and goal provided. If no website content is available, infer from the brief and stay concrete.
- Total under 300 words. Confident, direct, benefit-driven. No filler, no disclaimers, no questions."""


async def fetch_site_text(url: str) -> str:
    if not url.startswith("http"):
        url = "https://" + url
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True, headers={"User-Agent": "HighOnAI-PlanBot/1.0"}) as client:
            r = await client.get(url)
        text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", r.text, flags=re.S | re.I)
        text = re.sub(r"<[^>]+>", " ", text)
        return re.sub(r"\s+", " ", text).strip()[:4000]
    except Exception:
        return ""


@api_router.get("/")
async def root():
    return {"message": "High On AI API"}


@api_router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate):
    lead = Lead(prompt=input.prompt.strip(), source=input.source)
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leads.insert_one(doc)
    if OWNER_EMAIL and EMAIL_KEY:
        asyncio.create_task(notify_owner(lead))
    return lead


@api_router.get("/leads", response_model=List[Lead])
async def get_leads():
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    for lead in leads:
        if isinstance(lead['created_at'], str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    return leads


@api_router.post("/plan/stream")
async def plan_stream(input: LeadCreate):
    prompt = input.prompt.strip()
    lead = Lead(prompt=prompt, source=input.source)
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leads.insert_one(doc)
    if OWNER_EMAIL and EMAIL_KEY:
        asyncio.create_task(notify_owner(lead))

    site_url, site_text = "", ""
    match = URL_RE.search(prompt)
    if match:
        site_url = match.group(0).rstrip(".,)")
        site_text = await fetch_site_text(site_url)

    async def gen():
        collected = []
        try:
            chat = LlmChat(
                api_key=os.environ["EMERGENT_LLM_KEY"],
                session_id=f"plan-{lead.id}",
                system_message=SYSTEM_PROMPT,
            ).with_model("openai", "gpt-5.4")
            user_text = f"Growth brief: {prompt}\n"
            if site_text:
                user_text += f"\nWebsite ({site_url}) content excerpt:\n{site_text}\n"
            user_text += "\nWrite the instant plan now."
            async for ev in chat.stream_message(UserMessage(text=user_text)):
                if isinstance(ev, TextDelta):
                    collected.append(ev.content)
                    yield f"data: {json.dumps({'token': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            plan = Plan(lead_id=lead.id, prompt=prompt, url=site_url, plan="".join(collected))
            pdoc = plan.model_dump()
            pdoc['created_at'] = pdoc['created_at'].isoformat()
            await db.plans.insert_one(pdoc)
            yield f"data: {json.dumps({'done': True, 'plan_id': plan.id})}\n\n"
        except Exception:
            logger.exception("Plan generation failed")
            yield f"data: {json.dumps({'error': 'Plan generation failed. Please try again.'})}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/plans", response_model=List[Plan])
async def get_plans():
    plans = await db.plans.find({}, {"_id": 0}).to_list(1000)
    for plan in plans:
        if isinstance(plan['created_at'], str):
            plan['created_at'] = datetime.fromisoformat(plan['created_at'])
    return plans


# ---------- Auth endpoints ----------
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": input.name.strip(),
        "picture": "",
        "password_hash": hash_password(input.password),
        "auth_provider": "email",
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    set_auth_cookies(response, user["user_id"], email)
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.strip().lower()
    identifier = f"{request.client.host}:{email}"
    since = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    fails = await db.login_attempts.count_documents({"identifier": identifier, "created_at": {"$gte": since}})
    if fails >= 5:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.insert_one({"identifier": identifier, "created_at": datetime.now(timezone.utc).isoformat()})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    set_auth_cookies(response, user["user_id"], email)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"status": "logged_out"}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["user_id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"status": "refreshed"}


@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session id")
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "auth_provider": "google",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {k: v for k, v in user.items() if k not in ("password_hash", "_id")}


# ---------- Payments (auth required) ----------
@api_router.post("/payments/create-order")
async def create_order(input: OrderInput, request: Request):
    user = await get_current_user(request)
    amount_paise = int(round(input.amount_rupees * 100))
    try:
        order = await asyncio.to_thread(
            rzp_client.order.create,
            {"amount": amount_paise, "currency": "INR", "payment_capture": 1, "receipt": f"rcpt_{uuid.uuid4().hex[:12]}"},
        )
    except Exception:
        logger.exception("Razorpay order creation failed")
        raise HTTPException(status_code=502, detail="Payment gateway error. Please try again.")
    doc = {
        "id": str(uuid.uuid4()),
        "order_id": order["id"],
        "payment_id": "",
        "user_id": user["user_id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "amount": amount_paise,
        "currency": "INR",
        "package_name": input.package_name.strip(),
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payments.insert_one(doc)
    return {"order_id": order["id"], "amount": amount_paise, "currency": "INR", "key_id": os.environ.get("RAZORPAY_KEY_ID")}


@api_router.post("/payments/verify")
async def verify_payment(input: VerifyInput, request: Request):
    user = await get_current_user(request)
    try:
        await asyncio.to_thread(
            rzp_client.utility.verify_payment_signature,
            {
                "razorpay_order_id": input.razorpay_order_id,
                "razorpay_payment_id": input.razorpay_payment_id,
                "razorpay_signature": input.razorpay_signature,
            },
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    payment = await db.payments.find_one({"order_id": input.razorpay_order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.payments.update_one(
        {"order_id": input.razorpay_order_id, "user_id": user["user_id"]},
        {"$set": {"status": "paid", "payment_id": input.razorpay_payment_id, "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    if payment.get("status") != "paid" and payment.get("email") and EMAIL_KEY:
        asyncio.create_task(send_receipt(
            to=payment["email"],
            name=payment.get("name", ""),
            amount_paise=payment["amount"],
            package_name=payment.get("package_name", ""),
            payment_id=input.razorpay_payment_id,
        ))
        asyncio.create_task(notify_owner_payment(
            name=payment.get("name", ""),
            email=payment["email"],
            amount_paise=payment["amount"],
            package_name=payment.get("package_name", ""),
            payment_id=input.razorpay_payment_id,
        ))
    return {"status": "paid"}


@api_router.post("/payments/webhook")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
    if secret:
        signature = request.headers.get("X-Razorpay-Signature", "")
        try:
            await asyncio.to_thread(rzp_client.utility.verify_webhook_signature, payload.decode(), signature, secret)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    try:
        event = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")
    if event.get("event") != "payment.captured":
        return {"status": "ignored"}
    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id", "")
    payment_id = entity.get("id", "")
    if not order_id or not payment_id:
        return {"status": "ignored"}
    # Cross-check with Razorpay API — defense in depth when no webhook secret is configured
    try:
        fetched = await asyncio.to_thread(rzp_client.payment.fetch, payment_id)
    except Exception:
        logger.exception("Webhook payment fetch failed")
        raise HTTPException(status_code=502, detail="Could not confirm payment")
    if fetched.get("status") != "captured" or fetched.get("order_id") != order_id:
        return {"status": "mismatch"}
    payment = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
    if not payment:
        return {"status": "unknown_order"}
    if payment.get("status") != "paid":
        await db.payments.update_one(
            {"order_id": order_id},
            {"$set": {"status": "paid", "payment_id": payment_id, "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
        if payment.get("email") and EMAIL_KEY:
            asyncio.create_task(send_receipt(
                to=payment["email"],
                name=payment.get("name", ""),
                amount_paise=payment["amount"],
                package_name=payment.get("package_name", ""),
                payment_id=payment_id,
            ))
            asyncio.create_task(notify_owner_payment(
                name=payment.get("name", ""),
                email=payment["email"],
                amount_paise=payment["amount"],
                package_name=payment.get("package_name", ""),
                payment_id=payment_id,
            ))
    return {"status": "processed"}


class LogHoursInput(BaseModel):
    payment_id: str
    hours: float = Field(gt=0, le=100)


@api_router.get("/account/summary")
async def account_summary(request: Request):
    user = await get_current_user(request)
    payments = await db.payments.find({"user_id": user["user_id"], "status": "paid"}, {"_id": 0}).to_list(100)
    for p in payments:
        m = re.search(r"(\d+)\s*hours?", p.get("package_name", ""))
        p["hours_total"] = int(m.group(1)) if m else 0
        p["hours_used"] = p.get("hours_used", 0)
    return {
        "user": {"name": user.get("name", ""), "email": user.get("email", "")},
        "payments": payments,
        "hours_total": sum(p["hours_total"] for p in payments),
        "hours_used": sum(p["hours_used"] for p in payments),
        "spend_total": sum(p.get("amount", 0) for p in payments),
    }


@api_router.post("/account/log-hours")
async def log_hours(input: LogHoursInput, request: Request):
    user = await get_current_user(request)
    if not OWNER_EMAIL or user.get("email") != OWNER_EMAIL:
        raise HTTPException(status_code=403, detail="Owner only")
    result = await db.payments.update_one({"id": input.payment_id}, {"$inc": {"hours_used": input.hours}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"status": "logged"}


@api_router.get("/payments")
async def get_payments():
    payments = await db.payments.find({"status": "paid"}, {"_id": 0}).to_list(1000)
    for p in payments:
        e = p.get("email") or ""
        p["email"] = (e[:2] + "***") if e else ""
    return payments


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[SITE_URL] if SITE_URL else os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.on_event("startup")
async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
