from fastapi import FastAPI, APIRouter
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
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
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


# --- Email guardrail gate (G2/G3 structural checks) ---
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


# --- Instant plan agent ---
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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

