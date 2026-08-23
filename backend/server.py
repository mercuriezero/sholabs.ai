from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, RedirectResponse
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
OWNER_EMAIL = (os.environ.get("OWNER_EMAIL") or "").strip().lower() or None
SITE_URL = os.environ.get("SITE_URL", "")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

rzp_client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), os.environ.get("RAZORPAY_KEY_SECRET", "")))


# ---------- Models ----------
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    email: str = ""
    source: str = "hero_prompt"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    source: str = "hero_prompt"


class Plan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str = ""
    user_id: str = ""
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
    amount_usd: float = Field(gt=0, le=100000)
    package_name: str = Field(default="", max_length=80)
    coupon_code: str = Field(default="", max_length=40)
    launch: bool = False


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


def is_owner_email(email: str) -> bool:
    return bool(OWNER_EMAIL) and (email or "").strip().lower() == OWNER_EMAIL


def user_is_admin(user: dict) -> bool:
    return is_owner_email(user.get("email", "")) or user.get("role") == "admin"


def public_user(user: dict) -> dict:
    u = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    u["is_owner"] = is_owner_email(user.get("email", ""))
    u["is_admin"] = user_is_admin(user)
    return u


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if not user_is_admin(user):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


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
        subject = "New growth brief · High On AI"
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
        subject = f"Payment received · {amount} · {name or email}"
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


async def send_low_balance(*, to: str, name: str, package_name: str, remaining: float):
    try:
        subject = f"Running low · {remaining:g} hours left in your pack"
        greeting = f"Hi {escape(name)}," if name else "Hi,"
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#111">'
            f'<h2 style="margin:0 0 12px">{remaining:g} hours left in your pack</h2>'
            f'<p style="margin:0 0 8px">{greeting} your <strong>{escape(package_name)}</strong> is almost used up.</p>'
            '<p style="margin:0 0 20px;color:#555">Top up in one click to keep momentum · same flat rate, hours roll over 90 days.</p>'
            f'<p style="margin:0"><a href="{escape(SITE_URL)}/fractional-cxo">Top up your pack</a></p>'
            f'<p style="font-size:12px;color:#888;margin-top:24px">Sent by {escape(EMAIL_FROM_NAME)} · account balance alert</p>'
            '</td></tr></table>'
        )
        await send_email(to=to, subject=subject, html=html)
    except Exception:
        logger.exception("Low-balance email failed")


async def send_receipt(*, to: str, name: str, amount_paise: int, package_name: str, payment_id: str):
    try:
        amount = f"₹{amount_paise / 100:,.0f}"
        subject = f"Payment received · {amount} · High On AI"
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
            f'<p style="margin:0 0 20px;color:#555">{greeting} thank you · your payment is confirmed.</p>'
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


# ---------- 360 research agent ----------
URL_RE = re.compile(r"(https?://[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?)", re.I)
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

RESEARCH_PROMPT = """You are the High On AI 360 research agent · a senior growth strategist at an AI-powered marketing agency.
A logged-in client gives you their website and/or growth goal. Do an end-to-end marketing read and deliver a one-page snapshot plus an aggressive 90-day plan.

High On AI services and pricing (weave the right ones into the plan by name):
- Service products, priced per unit: AI Videos $85 per video · GEO/LLM citation pages $950 per 20 pages · UGC ad creatives $115 each (volume tiers drop to $80 at 500+ and $70 at 5000+) · Social media management $700/month · Voice AI agent $1,150 setup per agent plus $0.12/minute usage · Affiliate and Partners program: Starter $175-290/month (up to 25 partners, 2% commission on partner sales), Growth $460-860/month (up to 100 partners, 1.5%), Pro managed $1,450+/month (unlimited, 1%).
- Fractional AI CXO leadership is billed separately, hourly only: flat $30/hour via success packs: Trial 4h $120 · Starter 25h $690 · Momentum 50h $1,290 · Scale 100h $2,400.
- Pilot tiers: Pilot Sprint $290 · Growth Pilot $580 · Full Engine Pilot $1,150.
- A one-click 9% launch discount is available to everyone at checkout; the team may also issue special promo codes. Do not invent any other discounts.

Output rules:
- Plain text with markdown formatting only: '## ' section headings, '### ' phase headings and '- ' bullets. No tables, no code blocks, no links.
- Structure exactly:
  1. One short opening line naming the single biggest opportunity you found.
  2. '## 360 Snapshot' with 4 bullets: market and category read, audience, competitive frame, biggest gap.
  3. '## Your Aggressive 90-Day Plan' with three phases: '### Days 1-15', '### Days 16-45', '### Days 46-90' · each with 3 quick actionables that name the High On AI service doing the work.
  4. '## Recommended Engine' with 2 bullets: the single best-fit pack or pilot (name and price) and why it fits, plus one add-on service.
- Tailor everything to the website content and goal provided. If no website content is available, infer from the brief and stay concrete.
- Total under 420 words. Confident, direct, aggressive but credible. No filler, no disclaimers, no questions."""


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


@app.get("/health")
async def health():
    return {"status": "ok"}


@api_router.get("/health")
async def api_health():
    return {"status": "ok"}


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


@api_router.post("/research/stream")
async def research_stream(input: LeadCreate, request: Request):
    user = await get_current_user(request)
    prompt = input.prompt.strip()
    lead = Lead(prompt=prompt, email=user.get("email", ""), source=input.source)
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
                session_id=f"research-{lead.id}",
                system_message=RESEARCH_PROMPT,
            ).with_model("openai", "gpt-5.4")
            user_text = f"Growth brief from {user.get('name') or 'the client'} ({user.get('email', '')}): {prompt}\n"
            if site_text:
                user_text += f"\nWebsite ({site_url}) content excerpt:\n{site_text}\n"
            user_text += "\nDeliver the 360 snapshot and the aggressive 90-day plan now."
            async for ev in chat.stream_message(UserMessage(text=user_text)):
                if isinstance(ev, TextDelta):
                    collected.append(ev.content)
                    yield f"data: {json.dumps({'token': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            plan = Plan(lead_id=lead.id, user_id=user.get("user_id", ""), prompt=prompt, url=site_url, plan="".join(collected))
            pdoc = plan.model_dump()
            pdoc['created_at'] = pdoc['created_at'].isoformat()
            await db.plans.insert_one(pdoc)
            yield f"data: {json.dumps({'done': True, 'plan_id': plan.id})}\n\n"
        except Exception:
            logger.exception("Research generation failed")
            yield f"data: {json.dumps({'error': 'Research failed. Please try again.'})}\n\n"

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


# ---------- Onboarding + saved snapshots + demo leads ----------
@api_router.post("/account/onboard")
async def mark_onboarded(request: Request):
    user = await get_current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"onboarded": True}})
    return {"status": "ok"}


@api_router.get("/account/plans")
async def account_plans(request: Request):
    user = await get_current_user(request)
    plans = await db.plans.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    plans.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return {"plans": plans}


DEMO_LEADS = [
    {"name": "Priya Nair", "company": "Zenlytic", "email": "priya@zenlytic.io", "phone": "+1 415 555 0142", "source": "GEO / AI citations", "status": "Qualified", "value": 4200, "date": "2026-08-02"},
    {"name": "Marcus Lee", "company": "Flowstate HR", "email": "marcus@flowstatehr.com", "phone": "+1 646 555 0198", "source": "AI Video", "status": "Verified", "value": 1700, "date": "2026-08-03"},
    {"name": "Sara Gomez", "company": "Brightcart", "email": "sara@brightcart.co", "phone": "+1 312 555 0176", "source": "Voice AI", "status": "Qualified", "value": 3600, "date": "2026-08-04"},
    {"name": "Daniel Okafor", "company": "Kairos Labs", "email": "daniel@kairoslabs.ai", "phone": "+1 202 555 0119", "source": "AI SDR outbound", "status": "New", "value": 0, "date": "2026-08-05"},
    {"name": "Emily Chen", "company": "Northwind Health", "email": "emily@northwind.health", "phone": "+1 617 555 0155", "source": "GEO / AI citations", "status": "Verified", "value": 5100, "date": "2026-08-05"},
    {"name": "Rahul Verma", "company": "Payloop", "email": "rahul@payloop.in", "phone": "+91 98200 11234", "source": "Fractional CXO", "status": "Qualified", "value": 6900, "date": "2026-08-06"},
    {"name": "Olivia Brooks", "company": "Cadence Studio", "email": "olivia@cadence.studio", "phone": "+44 20 7946 0321", "source": "UGC ads", "status": "New", "value": 0, "date": "2026-08-07"},
    {"name": "Tomás Rivera", "company": "Grivera Foods", "email": "tomas@griverafoods.com", "phone": "+1 305 555 0188", "source": "Social media", "status": "Qualified", "value": 2100, "date": "2026-08-08"},
    {"name": "Aisha Khan", "company": "Lumen Legal", "email": "aisha@lumenlegal.com", "phone": "+1 713 555 0144", "source": "AI Video", "status": "Verified", "value": 1700, "date": "2026-08-08"},
    {"name": "Ben Carter", "company": "Stackforge", "email": "ben@stackforge.dev", "phone": "+1 408 555 0167", "source": "AI SDR outbound", "status": "Qualified", "value": 2400, "date": "2026-08-09"},
    {"name": "Nadia Petrova", "company": "Aurora Skincare", "email": "nadia@auroraskin.co", "phone": "+1 917 555 0133", "source": "UGC ads", "status": "Verified", "value": 1150, "date": "2026-08-10"},
    {"name": "James Wright", "company": "Meridian SaaS", "email": "james@meridiansaas.com", "phone": "+1 512 555 0190", "source": "GEO / AI citations", "status": "Qualified", "value": 4800, "date": "2026-08-10"},
    {"name": "Ishaan Gupta", "company": "Trailhead Fitness", "email": "ishaan@trailhead.fit", "phone": "+91 99870 44521", "source": "Voice AI", "status": "New", "value": 0, "date": "2026-08-11"},
    {"name": "Grace Miller", "company": "Beacon Realty", "email": "grace@beaconrealty.com", "phone": "+1 480 555 0122", "source": "AI SDR outbound", "status": "Verified", "value": 2400, "date": "2026-08-11"},
    {"name": "Leo Fernandes", "company": "Portside Logistics", "email": "leo@portside.co", "phone": "+1 206 555 0170", "source": "Fractional CXO", "status": "Qualified", "value": 6900, "date": "2026-08-12"},
    {"name": "Hannah Cohen", "company": "Verda Wellness", "email": "hannah@verda.health", "phone": "+1 619 555 0159", "source": "AI Video", "status": "New", "value": 0, "date": "2026-08-12"},
    {"name": "Arjun Mehta", "company": "Cloudpeak Analytics", "email": "arjun@cloudpeak.ai", "phone": "+91 90040 77812", "source": "GEO / AI citations", "status": "Verified", "value": 5100, "date": "2026-08-13"},
    {"name": "Sofia Rossi", "company": "Bella Bakes", "email": "sofia@bellabakes.com", "phone": "+1 786 555 0111", "source": "Social media", "status": "Qualified", "value": 2100, "date": "2026-08-13"},
    {"name": "David Kim", "company": "Nimbus Fintech", "email": "david@nimbusfin.com", "phone": "+1 415 555 0203", "source": "Voice AI", "status": "Verified", "value": 3600, "date": "2026-08-14"},
    {"name": "Chloe Dubois", "company": "Atelier Mode", "email": "chloe@ateliermode.fr", "phone": "+33 1 70 18 99 21", "source": "UGC ads", "status": "Qualified", "value": 1600, "date": "2026-08-14"},
]


@api_router.get("/crm/leads")
async def crm_leads(request: Request):
    await get_current_user(request)
    qualified = sum(1 for l in DEMO_LEADS if l["status"] == "Qualified")
    verified = sum(1 for l in DEMO_LEADS if l["status"] == "Verified")
    pipeline = sum(l["value"] for l in DEMO_LEADS)
    return {"leads": DEMO_LEADS, "stats": {"total": len(DEMO_LEADS), "qualified": qualified, "verified": verified, "pipeline": pipeline}}


# ---------- Portal: demand scan · opportunities · page generation · leads ----------
def _slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "page").lower()).strip("-")
    return s[:50] or "page"


async def llm_json(system: str, user_text: str, session_prefix: str) -> dict:
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"{session_prefix}-{uuid.uuid4().hex[:8]}",
        system_message=system,
    ).with_model("openai", "gpt-5.4")
    collected = []
    async for ev in chat.stream_message(UserMessage(text=user_text)):
        if isinstance(ev, TextDelta):
            collected.append(ev.content)
        elif isinstance(ev, StreamDone):
            break
    raw = "".join(collected).strip()
    m = re.search(r"\{.*\}", raw, re.S)
    if m:
        raw = m.group(0)
    return json.loads(raw)


SCAN_SYSTEM = """You are High On AI's demand-intelligence agent. Given a company's website content and optional goal, analyze the business and surface real buyer-intent search demand.
Return ONLY valid minified JSON (no markdown, no prose) with EXACTLY this shape:
{"company":"","summary":"one sentence on what they do","products":["",""],"icp":"who buys from them","queries":[{"q":"buyer-intent search phrase","volume":<int>,"intent":"High|Medium"}]}
Rules: 60 to 100 query objects. Each q is a lowercase, specific long-tail buyer-intent phrase a real prospect would type into Google or ChatGPT, tailored to the company's products and ICP. volume is a realistic estimated monthly search count between 30 and 2000 (a few high, most mid/low). intent is High or Medium. No duplicate queries."""

PAGES_SYSTEM = """You are High On AI's page-generation agent. Given a company profile and target buyer-intent queries, produce SEO landing/resource pages that each cluster related queries.
Return ONLY valid minified JSON (no markdown): {"pages":[{"title":"","subtitle":"one line","hero":"2 sentence intro","services":[{"title":"","desc":"one sentence"}],"faqs":[{"q":"","a":"2 sentence answer"}],"target_queries":["",""]}]}
Rules: produce EXACTLY the requested number of pages. Each page clusters 8 to 15 related queries into target_queries, has exactly 3 services and exactly 4 faqs. Persuasive, specific, buyer-focused copy. FAQ answers should directly answer the target queries so LLMs can cite them."""


class ScanInput(BaseModel):
    url: str = Field(min_length=3, max_length=300)
    goal: str = Field(default="", max_length=500)


@api_router.post("/portal/scan")
async def portal_scan(input: ScanInput, request: Request):
    user = await get_current_user(request)
    url = input.url.strip()
    site_text = await fetch_site_text(url)
    prompt = f"Website: {url}\nGoal: {input.goal or 'grow qualified pipeline'}\n"
    if site_text:
        prompt += f"Website content excerpt:\n{site_text[:3500]}\n"
    prompt += "Analyze and return the JSON now."
    try:
        data = await llm_json(SCAN_SYSTEM, prompt, "scan")
    except Exception:
        logger.exception("Portal scan failed")
        raise HTTPException(status_code=502, detail="Scan failed. Please try again.")
    queries = [q for q in data.get("queries", []) if isinstance(q, dict) and q.get("q")]
    for q in queries:
        try:
            q["volume"] = int(q.get("volume") or 0)
        except (TypeError, ValueError):
            q["volume"] = 0
        q["intent"] = q.get("intent") if q.get("intent") in ("High", "Medium") else "Medium"
    queries.sort(key=lambda q: q["volume"], reverse=True)
    queries = queries[:100]
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "url": url,
        "company": data.get("company", "") or url,
        "summary": data.get("summary", ""),
        "products": data.get("products", [])[:20],
        "icp": data.get("icp", ""),
        "queries": queries,
        "missed": sum(q["volume"] for q in queries[:5]),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.delete_many({"user_id": user["user_id"]})
    await db.analyses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/portal/analysis")
async def portal_analysis(request: Request):
    user = await get_current_user(request)
    doc = await db.analyses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return doc or {}


class GenPagesInput(BaseModel):
    count: int = Field(default=6, ge=1, le=12)


@api_router.post("/portal/generate-pages")
async def portal_generate_pages(input: GenPagesInput, request: Request):
    user = await get_current_user(request)
    if not await llm_unlocked(user):
        raise HTTPException(status_code=402, detail="Unlock with any plan to generate and publish pages.")
    analysis = await db.analyses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=400, detail="Run a scan first.")
    top_q = [q["q"] for q in analysis.get("queries", [])[:60]]
    prompt = (
        f"Company: {analysis.get('company')}\nSummary: {analysis.get('summary')}\n"
        f"Products: {', '.join(analysis.get('products', []))}\nICP: {analysis.get('icp')}\n"
        f"Target queries: {', '.join(top_q)}\nProduce {input.count} pages now."
    )
    try:
        data = await llm_json(PAGES_SYSTEM, prompt, "pages")
    except Exception:
        logger.exception("Portal page generation failed")
        raise HTTPException(status_code=502, detail="Page generation failed. Please try again.")
    vol_map = {q["q"]: q.get("volume", 0) for q in analysis.get("queries", [])}
    await db.pages.delete_many({"user_id": user["user_id"]})
    pages_out = []
    for p in data.get("pages", [])[:input.count]:
        tqs = [t for t in p.get("target_queries", []) if isinstance(t, str)]
        reach = sum(vol_map.get(t, 0) for t in tqs) or (len(tqs) * 90)
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "owner_email": user.get("email", ""),
            "slug": _slugify(p.get("title", "")) + "-" + uuid.uuid4().hex[:6],
            "company": analysis.get("company", ""),
            "title": p.get("title", ""),
            "subtitle": p.get("subtitle", ""),
            "hero": p.get("hero", ""),
            "services": p.get("services", [])[:6],
            "faqs": p.get("faqs", [])[:8],
            "target_queries": tqs,
            "reach": reach,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.pages.insert_one(doc)
        doc.pop("_id", None)
        pages_out.append(doc)
    return {"pages": pages_out}


@api_router.get("/portal/pages")
async def portal_pages(request: Request):
    user = await get_current_user(request)
    pages = await db.pages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"pages": pages}


@api_router.get("/pages/{slug}")
async def public_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


class PageLeadInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(default="", max_length=120)
    email: str = Field(min_length=3, max_length=320)
    phone: str = Field(default="", max_length=40)
    country: str = Field(default="", max_length=80)
    message: str = Field(default="", max_length=1000)


@api_router.post("/pages/{slug}/lead")
async def page_lead(slug: str, input: PageLeadInput):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    doc = {
        "id": str(uuid.uuid4()),
        "owner_user_id": page["user_id"],
        "page_slug": slug,
        "page_title": page.get("title", ""),
        "name": input.name.strip(),
        "company": input.company.strip(),
        "email": input.email.strip().lower(),
        "phone": input.phone.strip(),
        "country": input.country.strip(),
        "message": input.message.strip(),
        "action": (input.message.strip()[:60] or "Requested a demo"),
        "status": "New Lead",
        "notes": "",
        "spam": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.portal_leads.insert_one(doc)
    if OWNER_EMAIL and EMAIL_KEY:
        asyncio.create_task(notify_owner(Lead(
            prompt=f"Landing page lead on '{page.get('title', '')}' from {input.name} ({doc['email']}, {input.company})",
            email=doc["email"], source="landing_page",
        )))
    return {"status": "ok"}


@api_router.get("/portal/leads")
async def portal_leads(request: Request):
    user = await get_current_user(request)
    leads = await db.portal_leads.find({"owner_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {
        "leads": leads,
        "stats": {
            "total": len(leads),
            "new": sum(1 for l in leads if l.get("status") == "New Lead"),
            "booked": sum(1 for l in leads if l.get("status") == "Booked"),
        },
    }


class LeadUpdate(BaseModel):
    notes: str | None = Field(default=None, max_length=1000)
    status: str | None = Field(default=None, max_length=40)
    spam: bool | None = None


@api_router.post("/portal/leads/{lead_id}")
async def update_portal_lead(lead_id: str, input: LeadUpdate, request: Request):
    user = await get_current_user(request)
    upd = {}
    if input.notes is not None:
        upd["notes"] = input.notes
    if input.status:
        upd["status"] = input.status
    if input.spam is not None:
        upd["spam"] = input.spam
    if not upd:
        return {"status": "noop"}
    r = await db.portal_leads.update_one({"id": lead_id, "owner_user_id": user["user_id"]}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "ok"}


# ---------- Portal: access gating, video & voice intake, overview ----------
async def user_has_paid(user: dict) -> bool:
    return await db.payments.count_documents({"user_id": user["user_id"], "status": "paid"}) > 0


async def llm_unlocked(user: dict) -> bool:
    return user_is_admin(user) or await user_has_paid(user)


@api_router.get("/portal/access")
async def portal_access(request: Request):
    user = await get_current_user(request)
    paid = await user_has_paid(user)
    return {"is_admin": user_is_admin(user), "has_paid": paid, "llm_unlocked": user_is_admin(user) or paid}


class VideoRequestInput(BaseModel):
    project_name: str = Field(min_length=1, max_length=120)
    video_type: str = Field(default="", max_length=60)
    script: str = Field(default="", max_length=5000)
    avatar: str = Field(default="", max_length=120)
    language: str = Field(default="", max_length=60)
    aspect_ratio: str = Field(default="", max_length=30)
    duration: str = Field(default="", max_length=30)
    brand_assets: str = Field(default="", max_length=2000)
    notes: str = Field(default="", max_length=2000)


@api_router.post("/portal/video-requests")
async def create_video_request(input: VideoRequestInput, request: Request):
    user = await get_current_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        **input.model_dump(),
        "status": "In production",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.video_requests.insert_one(doc)
    if OWNER_EMAIL and EMAIL_KEY:
        asyncio.create_task(notify_owner(Lead(
            prompt=f"New AI Video request '{input.project_name}' ({input.video_type}) from {user.get('name','')} ({user.get('email','')})",
            email=user.get("email", ""), source="video_studio",
        )))
    doc.pop("_id", None)
    return doc


@api_router.get("/portal/video-requests")
async def list_video_requests(request: Request):
    user = await get_current_user(request)
    items = await db.video_requests.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": items}


class VoiceRequestInput(BaseModel):
    agent_name: str = Field(min_length=1, max_length=120)
    website: str = Field(default="", max_length=300)
    purpose: str = Field(default="", max_length=80)
    voice: str = Field(default="", max_length=60)
    language: str = Field(default="", max_length=60)
    greeting: str = Field(default="", max_length=600)
    knowledge: str = Field(default="", max_length=5000)
    outcomes: str = Field(default="", max_length=2000)
    phone: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)


@api_router.post("/portal/voice-requests")
async def create_voice_request(input: VoiceRequestInput, request: Request):
    user = await get_current_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        **input.model_dump(),
        "status": "Building your agent",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.voice_requests.insert_one(doc)
    if OWNER_EMAIL and EMAIL_KEY:
        asyncio.create_task(notify_owner(Lead(
            prompt=f"New Voice AI request '{input.agent_name}' ({input.purpose}) from {user.get('name','')} ({user.get('email','')})",
            email=user.get("email", ""), source="voice_studio",
        )))
    doc.pop("_id", None)
    return doc


@api_router.get("/portal/voice-requests")
async def list_voice_requests(request: Request):
    user = await get_current_user(request)
    items = await db.voice_requests.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": items}


@api_router.get("/portal/overview")
async def portal_overview(request: Request):
    user = await get_current_user(request)
    payments = await db.payments.find({"user_id": user["user_id"], "status": "paid"}, {"_id": 0}).to_list(100)
    hours_total = sum(_pack_hours(p.get("package_name", "")) for p in payments)
    hours_used = sum(p.get("hours_used", 0) for p in payments)
    analysis = await db.analyses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {
        "leads": await db.portal_leads.count_documents({"owner_user_id": user["user_id"]}),
        "pages": await db.pages.count_documents({"user_id": user["user_id"]}),
        "opportunities": len(analysis.get("queries", [])) if analysis else 0,
        "video_requests": await db.video_requests.count_documents({"user_id": user["user_id"]}),
        "voice_requests": await db.voice_requests.count_documents({"user_id": user["user_id"]}),
        "hours_total": hours_total,
        "hours_remaining": max(hours_total - hours_used, 0),
        "llm_unlocked": user_is_admin(user) or len(payments) > 0,
    }


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
        "onboarded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    set_auth_cookies(response, user["user_id"], email)
    return public_user(user)


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
    return public_user(user)


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
    user = await get_current_user(request)
    return public_user(user)


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
    return public_user(user)


# ---------- Custom Google OAuth (sholabs.ai) ----------
def _google_redirect_uri(origin: str) -> str:
    return f"{origin.rstrip('/')}/api/auth/google/callback"


async def _create_session(user_id: str) -> str:
    token = f"sess_{uuid.uuid4().hex}{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return token


@api_router.get("/auth/google/login")
async def google_login(request: Request, origin: str = ""):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google auth not configured")
    if not origin:
        origin = str(request.base_url).rstrip("/")
    state = jwt.encode(
        {"origin": origin, "nonce": uuid.uuid4().hex,
         "exp": datetime.now(timezone.utc) + timedelta(minutes=10)},
        JWT_SECRET, algorithm=JWT_ALGORITHM,
    )
    from urllib.parse import urlencode
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": _google_redirect_uri(origin),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
        "include_granted_scopes": "true",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}", status_code=302)


@api_router.get("/auth/google/callback")
async def google_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    fallback = str(request.base_url).rstrip("/")
    try:
        payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        origin = payload.get("origin") or fallback
    except jwt.InvalidTokenError:
        return RedirectResponse(f"{fallback}/?auth=error", status_code=302)
    if error or not code:
        return RedirectResponse(f"{origin}/?auth=error", status_code=302)
    redirect_uri = _google_redirect_uri(origin)
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            tok = await http.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            })
            tok.raise_for_status()
            access_token = tok.json().get("access_token")
            ui = await http.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
            ui.raise_for_status()
            info = ui.json()
    except Exception:
        logger.exception("Google OAuth exchange failed")
        return RedirectResponse(f"{origin}/?auth=error", status_code=302)
    email = (info.get("email") or "").lower()
    if not email:
        return RedirectResponse(f"{origin}/?auth=error", status_code=302)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    is_new = user is None
    if is_new:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": info.get("name", ""),
            "picture": info.get("picture", ""),
            "auth_provider": "google",
            "role": "user",
            "onboarded": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    token = await _create_session(user["user_id"])
    dest = f"{origin}/?welcome=1" if (is_new or not user.get("onboarded")) else f"{origin}/"
    resp = RedirectResponse(dest, status_code=302)
    resp.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return resp


# ---------- Payments (auth required) ----------
@api_router.post("/payments/create-order")
async def create_order(input: OrderInput, request: Request):
    user = await get_current_user(request)
    disc = await resolve_discount(input.amount_usd, input.coupon_code, input.launch)
    if disc["error"]:
        raise HTTPException(status_code=400, detail=disc["error"])
    pct = disc["pct"]
    original_cents = int(round(input.amount_usd * 100))
    amount_cents = int(round(input.amount_usd * (1 - pct / 100) * 100))
    try:
        order = await asyncio.to_thread(
            rzp_client.order.create,
            {"amount": amount_cents, "currency": "USD", "payment_capture": 1, "receipt": f"rcpt_{uuid.uuid4().hex[:12]}"},
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
        "amount": amount_cents,
        "original_amount": original_cents,
        "coupon_code": disc["code"],
        "discount_pct": pct,
        "coupon_is_custom": disc["is_custom"],
        "coupon_redeemed": False,
        "currency": "USD",
        "package_name": input.package_name.strip(),
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payments.insert_one(doc)
    return {"order_id": order["id"], "amount": amount_cents, "currency": "USD", "key_id": os.environ.get("RAZORPAY_KEY_ID"), "discount_pct": pct, "coupon_code": disc["code"]}


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
    if payment.get("status") != "paid" and payment.get("coupon_is_custom") and payment.get("coupon_code"):
        await db.payments.update_one(
            {"order_id": input.razorpay_order_id, "user_id": user["user_id"]},
            {"$set": {"coupon_redeemed": True}},
        )
        await db.coupons.update_one({"code": payment["coupon_code"]}, {"$inc": {"used_count": 1}})
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
    # Cross-check with Razorpay API · defense in depth when no webhook secret is configured
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
        if payment.get("coupon_is_custom") and payment.get("coupon_code") and not payment.get("coupon_redeemed"):
            await db.payments.update_one({"order_id": order_id}, {"$set": {"coupon_redeemed": True}})
            await db.coupons.update_one({"code": payment["coupon_code"]}, {"$inc": {"used_count": 1}})
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


def _pack_hours(package_name: str) -> int:
    m = re.search(r"(\d+)\s*hours?", package_name or "")
    return int(m.group(1)) if m else 0


@api_router.get("/account/summary")
async def account_summary(request: Request):
    user = await get_current_user(request)
    payments = await db.payments.find({"user_id": user["user_id"], "status": "paid"}, {"_id": 0}).to_list(100)
    for p in payments:
        p["hours_total"] = _pack_hours(p.get("package_name", ""))
        p["hours_used"] = p.get("hours_used", 0)
    return {
        "user": {"name": user.get("name", ""), "email": user.get("email", "")},
        "is_owner": is_owner_email(user.get("email", "")),
        "is_admin": user_is_admin(user),
        "payments": payments,
        "hours_total": sum(p["hours_total"] for p in payments),
        "hours_used": sum(p["hours_used"] for p in payments),
        "spend_total": sum(p.get("amount", 0) for p in payments),
    }


@api_router.get("/account/all-payments")
async def all_payments(request: Request):
    user = await get_current_user(request)
    if not user_is_admin(user):
        raise HTTPException(status_code=403, detail="Admin only")
    payments = await db.payments.find({"status": "paid"}, {"_id": 0}).to_list(500)
    for p in payments:
        p["hours_total"] = _pack_hours(p.get("package_name", ""))
        p["hours_used"] = p.get("hours_used", 0)
    return payments


@api_router.post("/account/log-hours")
async def log_hours(input: LogHoursInput, request: Request):
    user = await get_current_user(request)
    if not user_is_admin(user):
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.payments.update_one({"id": input.payment_id}, {"$inc": {"hours_used": input.hours}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment = await db.payments.find_one({"id": input.payment_id}, {"_id": 0})
    total = _pack_hours(payment.get("package_name", ""))
    remaining = total - payment.get("hours_used", 0)
    if total and remaining < 5 and not payment.get("low_balance_notified") and payment.get("email") and EMAIL_KEY:
        await db.payments.update_one({"id": input.payment_id}, {"$set": {"low_balance_notified": True}})
        asyncio.create_task(send_low_balance(
            to=payment["email"],
            name=payment.get("name", ""),
            package_name=payment.get("package_name", ""),
            remaining=max(remaining, 0),
        ))
    return {"status": "logged", "hours_used": payment.get("hours_used", 0)}


@api_router.get("/payments")
async def get_payments():
    payments = await db.payments.find({"status": "paid"}, {"_id": 0}).to_list(1000)
    for p in payments:
        e = p.get("email") or ""
        p["email"] = (e[:2] + "***") if e else ""
    return payments


# ---------- Coupons & discounts ----------
LAUNCH_PCT = 9


def _gen_launch_code() -> str:
    return f"HIA9-{uuid.uuid4().hex[:5].upper()}"


def _coupon_expired(doc: dict) -> bool:
    exp = doc.get("expiry")
    if not exp:
        return False
    try:
        return datetime.fromisoformat(exp).date() < datetime.now(timezone.utc).date()
    except ValueError:
        return False


async def resolve_discount(amount_usd: float, coupon_code: str, launch: bool) -> dict:
    """Server-authoritative discount resolution. Never trust a client-sent percentage."""
    if launch:
        return {"pct": LAUNCH_PCT, "code": _gen_launch_code(), "is_custom": False, "error": None}
    code = (coupon_code or "").strip().upper()
    if not code:
        return {"pct": 0, "code": "", "is_custom": False, "error": None}
    doc = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not doc or not doc.get("active", True):
        return {"pct": 0, "code": "", "is_custom": False, "error": "This code isn't valid."}
    if _coupon_expired(doc):
        return {"pct": 0, "code": "", "is_custom": False, "error": "This code has expired."}
    mx = doc.get("max_uses")
    if mx is not None and doc.get("used_count", 0) >= mx:
        return {"pct": 0, "code": "", "is_custom": False, "error": "This code has reached its usage limit."}
    return {"pct": doc["discount_pct"], "code": code, "is_custom": True, "error": None}


class CouponCheck(BaseModel):
    amount_usd: float = Field(gt=0, le=100000)
    coupon_code: str = Field(default="", max_length=40)
    launch: bool = False


@api_router.post("/coupons/validate")
async def validate_coupon(input: CouponCheck, request: Request):
    await get_current_user(request)
    r = await resolve_discount(input.amount_usd, input.coupon_code, input.launch)
    if r["error"]:
        return {"valid": False, "error": r["error"]}
    pct = r["pct"]
    discount = round(input.amount_usd * pct / 100, 2)
    return {
        "valid": pct > 0,
        "discount_pct": pct,
        "code": r["code"],
        "launch": input.launch,
        "discount_amount": discount,
        "final_amount": round(input.amount_usd - discount, 2),
    }


class CouponCreate(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    discount_pct: float = Field(gt=0, le=90)
    label: str = Field(default="", max_length=120)
    expiry: str = Field(default="", max_length=40)
    max_uses: int | None = Field(default=None, ge=1, le=1000000)


@api_router.get("/admin/coupons")
async def list_coupons(request: Request):
    await require_admin(request)
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/coupons")
async def create_coupon(input: CouponCreate, request: Request):
    admin = await require_admin(request)
    code = input.code.strip().upper()
    if not re.fullmatch(r"[A-Z0-9\-]{3,40}", code):
        raise HTTPException(status_code=400, detail="Codes may use letters, numbers and dashes only.")
    if code.startswith("HIA9"):
        raise HTTPException(status_code=400, detail="Codes starting with HIA9 are reserved for the launch discount.")
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(status_code=400, detail="A coupon with this code already exists.")
    expiry = input.expiry.strip()
    if expiry:
        try:
            datetime.fromisoformat(expiry)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date.")
    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "discount_pct": input.discount_pct,
        "label": input.label.strip(),
        "expiry": expiry,
        "max_uses": input.max_uses,
        "used_count": 0,
        "active": True,
        "created_by": admin.get("email", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.coupons.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    await require_admin(request)
    await db.coupons.delete_one({"id": coupon_id})
    return {"status": "deleted"}


# ---------- Admin: role management (super-owner only) ----------
class RoleInput(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    role: str = Field(pattern="^(user|admin)$")


@api_router.get("/admin/users")
async def admin_users(request: Request):
    await _owner_only(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(2000)
    return [
        {
            "user_id": u.get("user_id"),
            "email": u.get("email"),
            "name": u.get("name", ""),
            "role": u.get("role", "user"),
            "is_owner": is_owner_email(u.get("email", "")),
            "auth_provider": u.get("auth_provider", "email"),
        }
        for u in users
    ]


@api_router.post("/admin/set-role")
async def set_role(input: RoleInput, request: Request):
    await _owner_only(request)
    email = input.email.strip().lower()
    if is_owner_email(email):
        raise HTTPException(status_code=400, detail="The super-owner is always an admin and can't be changed.")
    result = await db.users.update_one({"email": email}, {"$set": {"role": input.role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No registered user with that email. Ask them to sign up first.")
    return {"status": "ok", "email": email, "role": input.role}


# ---------- AI concierge ----------
BOT_BASE_PROMPT = """You are the High On AI concierge: part salesperson, part senior growth consultant. You answer questions about High On AI and guide visitors to the right next step.

ABOUT HIGH ON AI (ground truth):
- Creative AI-powered marketing agency, powered by QuantumAI OS Pvt Ltd.
- Promise: human intelligence + AI for marketing, sales and growth, delivered as one full-stack H.I.A.I. engine.
- Three pillars. Get Cited (GEO: getting brands cited by ChatGPT, Gemini, Perplexity, Claude and Google AI Overviews; 94% of B2B buyers now research with LLMs and AI cites only 3-4 brands per answer). Get Watched (AI video engine: videos scripted, generated and repurposed weekly; 89% of buyers say video seals the deal). Get Chosen (agentic outbound plus Voice AI agents that qualify leads, follow up in seconds and book meetings).
- One live command center dashboard across every pillar: AI citation rate, share of voice vs competitors, views, watch-through, pipeline, reply rates. Real-time, not monthly PDFs.
- Fractional AI CXO: C-level growth ownership at a flat $30/hour. Success packs: Trial 4 hours $120, Starter 25 hours $690, Momentum 50 hours $1,290, Scale 100 hours $2,400. Unused hours roll over 90 days. A project estimator on the Fractional CXO page scopes hours and recommends a pack.
- Pilots: Pilot Sprint $290 (one pillar, 2 weeks), Growth Pilot $580 (two pillars, 30 days), Full Engine Pilot $1,150 (all three pillars). No long-term contract. No sales call needed to get a plan.
- A one-click 9% launch discount is available to everyone at checkout; the team can also issue special promo codes. Do not invent any other discounts.
- Free instant plan: visitors paste their website plus goal in the homepage prompt box and get an AI-generated growth plan in seconds.
- Next step for serious prospects: a free 20-minute working session with a written 90-day plan (no pitch deck) at https://cal.com/sunnyrai/30min
- Positioning vs alternatives: one accountable engine instead of 5+ disconnected vendors; clients typically save 50-75% versus the equivalent tool stack and agencies.
- Payments are online via Razorpay and require a free account. Logged-in clients see hours used vs remaining at /account.

HOW TO BEHAVE:
- Sound like a sharp senior consultant, not a support bot. Concise: 2-4 sentences per answer unless detail is requested.
- Plain text only: no markdown headings, no bullet spam, no em dashes. Short lines are fine.
- Diagnose before prescribing: if the visitor's goal is unclear, ask one smart question, then recommend.
- Always end with a concrete next step when relevant: the free instant plan on the homepage, the project estimator on /fractional-cxo, a success pack, or the working session link.
- When a visitor shows buying intent (starting out, pricing fit, pilots, booking, timelines), naturally ask for their name and work email so the team can follow up within 24 hours. Keep it light, one line. When they share it, thank them warmly and confirm the team will reach out.
- Never invent pricing, discounts, results or capabilities beyond what is listed. If something is not listed, say the team confirms scope in the working session.
- On competitor questions: stay factual and brief, then pivot to outcomes and the pilot."""


class ChatInput(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=2000)


class TeachInput(BaseModel):
    fact: str = Field(min_length=3, max_length=500)


@api_router.post("/chat/stream")
async def chat_stream(input: ChatInput):
    facts = await db.bot_knowledge.find({}, {"_id": 0, "fact": 1}).to_list(200)
    system = BOT_BASE_PROMPT
    if facts:
        system += "\n\nAdditional context taught by the founder (treat as ground truth):\n" + "\n".join(
            f"- {f['fact']}" for f in facts
        )
    history = await db.chats.find({"session_id": input.session_id}, {"_id": 0}).sort("created_at", -1).to_list(8)
    history.reverse()
    transcript = "\n".join(
        f"{'Visitor' if m['role'] == 'user' else 'Concierge'}: {m['text']}" for m in history
    )

    async def gen():
        collected = []
        try:
            chat = LlmChat(
                api_key=os.environ["EMERGENT_LLM_KEY"],
                session_id=f"concierge-{input.session_id}-{uuid.uuid4().hex[:6]}",
                system_message=system,
            ).with_model("openai", "gpt-5.4")
            user_text = input.message
            if transcript:
                user_text = f"Conversation so far:\n{transcript}\n\nVisitor: {input.message}\n\nReply as the concierge."
            async for ev in chat.stream_message(UserMessage(text=user_text)):
                if isinstance(ev, TextDelta):
                    collected.append(ev.content)
                    yield f"data: {json.dumps({'token': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            reply = "".join(collected)
            now = datetime.now(timezone.utc).isoformat()
            await db.chats.insert_many([
                {"id": str(uuid.uuid4()), "session_id": input.session_id, "role": "user", "text": input.message, "created_at": now},
                {"id": str(uuid.uuid4()), "session_id": input.session_id, "role": "assistant", "text": reply, "created_at": now},
            ])
            captured = ""
            match = EMAIL_RE.search(input.message)
            if match:
                captured = match.group(0).lower()
                existing = await db.leads.find_one({"source": "concierge_chat", "email": captured})
                if not existing:
                    lead = Lead(
                        prompt=f"Concierge chat lead · last message: {input.message[:400]}",
                        email=captured,
                        source="concierge_chat",
                    )
                    ldoc = lead.model_dump()
                    ldoc["created_at"] = ldoc["created_at"].isoformat()
                    await db.leads.insert_one(ldoc)
                    if OWNER_EMAIL and EMAIL_KEY:
                        asyncio.create_task(notify_owner(lead))
            yield f"data: {json.dumps({'done': True, 'captured': captured})}\n\n"
        except Exception:
            logger.exception("Chat failed")
            yield f"data: {json.dumps({'error': 'Something glitched. Please try again.'})}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _owner_only(request: Request) -> dict:
    user = await get_current_user(request)
    if not OWNER_EMAIL or user.get("email") != OWNER_EMAIL:
        raise HTTPException(status_code=403, detail="Owner only")
    return user


@api_router.get("/chat/teach")
async def list_facts(request: Request):
    await require_admin(request)
    return await db.bot_knowledge.find({}, {"_id": 0}).to_list(200)


@api_router.post("/chat/teach")
async def teach_fact(input: TeachInput, request: Request):
    await require_admin(request)
    doc = {"id": str(uuid.uuid4()), "fact": input.fact.strip(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.bot_knowledge.insert_one(doc)
    return {"id": doc["id"], "fact": doc["fact"], "created_at": doc["created_at"]}


@api_router.delete("/chat/teach/{fact_id}")
async def delete_fact(fact_id: str, request: Request):
    await require_admin(request)
    await db.bot_knowledge.delete_one({"id": fact_id})
    return {"status": "deleted"}


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
