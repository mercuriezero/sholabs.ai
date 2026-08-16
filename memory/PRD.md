# PRD — High On AI Landing Page

## Original Problem Statement
Build a premium, white-theme landing page for High On AI (creative AI-powered marketing agency, powered by QuantumAI OS Pvt Ltd) using attached reference screenshots: Gushwork-style bold hero headline, Clay.com-style prompt-box CTA ("hionai prompt"), Clay.com-style auto-cycling services portal, and brand logo/favicon with 8-color stripe palette. Hero copy: "Full-Stack H.I.A.I. Engine / Human intelligence + AI for marketing, sales, and growth. / Deploy the complete growth engine with a high-performing Fractional AI Marketing CXO. / 94% of B2B buyers now use LLMs to research vendors and AI cites only 3–4 brands per answer." Requirements: genuine FAQ (LLM relevance), SEO/AEO/GEO best practices (semantic HTML, schema.org FAQPage + Organization, meta tags, LLM-quotable copy), footer + giant glassy transparent "high on ai" brand wall occupying bottom ~40vh in logo style, services: GEO leads (noticed on ChatGPT/Gemini), AI videos, Voice AI, fractional CXO; portal cycles every 3s, typewriter text every ~4s.

## Stack Decision (SEO/AEO/GEO rationale)
React SPA (CRA/craco) + FastAPI + MongoDB (provisioned template). SEO-critical content lives in static `public/index.html`: title, meta description, OG/Twitter tags, canonical, favicon, and JSON-LD Organization + FAQPage schemas — all present in the initial HTML payload for crawlers and LLM fetchers. Body content uses semantic HTML (header/nav/main/section/footer, h1→h2→h3 hierarchy, dl for stats). MongoDB stores prompt-box lead briefs via /api/leads.

## Design System
- White theme only; ink #0A0A0A text, neutral-500 secondary, hairline black/5 borders.
- Brand stripes from logo: yellow #FFD900, cyan #2BBCC4, green #1FA84A, magenta #E200C4, red #ED1C24, royal blue #2B39D1, orange #F7941E, purple #91268F — used as accents, tab/panel tints, gradient-clipped display text.
- Type: Outfit (display/headings) + Inter (body/UI) + JetBrains Mono (eyebrow labels).
- Signature elements: subtle masked grid hero background; Clay-style prompt CTA with typewriter ghost text + chips + black circular arrow submit; glassy stripe brand wall (40vh) at page bottom.
- Motion: framer-motion staggered hero reveal, AnimatePresence portal crossfade (3s cycle), accordion animations; prefers-reduced-motion respected.

## Implemented (2026-08-15, rev 2)
- Sticky glass nav with logo, anchor links, "Book a growth call" CTA wired to https://cal.com/sunnyrai/30min, mobile menu.
- Hero: redesigned minimal eyebrow (stripe-gradient dashes + letterspaced mono, pill removed), H1 with stripe-gradient text, subheadline "New revenue from LLMs. Video that converts — 89% of buyers say it seals the deal.", prompt-box CTA (typewriter phrases ~4s cycle, 3 chips: GEO Leads / AI Videos / Voice AI, POST /api/leads + sonner toast), reassurance line "No pitch deck. A 20-minute working session and a written 90-day plan."
- Use Cases section ("Be the answer AI gives."): visual mock of buyer query → AI answer citing the brand across ChatGPT/Gemini/Perplexity/AI Overviews/Claude + 5 term cards (GEO, AEO, LLM SEO, AI Visibility, LLM Brand Visibility).
- Services portal: 3 pillars (GEO Leads blue, AI Videos magenta, Voice AI green) auto-cycling every 3s with mock product UI panels. Fractional CXO removed from portal and hero per user request.
- Dashboard section ("One dashboard. Every signal. Live."): 3 pillar cards (Get Cited/Watched/Chosen), mock command-center window with LIVE badge, KPI tiles, auto-rotating live signal feed, "See the Dashboard →" CTA to cal.com.
- Process section: 4 steps (URL + goal → instant plan → pilot → scale with add-ons), CTA to prompt box.
- Why High On AI section: 5-row comparison table (vs 5 vendors) + "The stack you'd otherwise need" replacement table (Profound/HeyGen/impact.com/GRIN/Apollo/Clari categories).
- Pilot trust section: "Trust a pilot, not a pitch" + 3 points + "Scope your pilot" CTA to cal.com.
- FAQ: 6 genuine GEO/LLM Q&As, animated accordion, matching FAQPage JSON-LD in head.
- Footer: link columns incl. "Fractional AI CXO" page link, "Powered by QuantumAI OS Pvt Ltd", copyright, stripe bar, glassy 40vh "high on ai" brand wall.
- Dedicated page /fractional-cxo (React Router): hero, "Is this you?" audiences, scope of ownership (6 items), fractional vs full-time table, first-90-days phases, mini FAQ, Cal.com CTAs, shared footer.
- Backend: POST/GET /api/leads (MongoDB persistence, validated).
- Accessibility: focus-visible rings, aria labels, keyboard-operable accordion/tabs, reduced-motion handling.

## Verified
- POST /api/leads + GET /api/leads via external URL (lead persisted).
- UI e2e via screenshots: hero render, portal auto-cycle (AI Videos → Voice AI), FAQ open, footer/brand wall, prompt submit with success toast, lead visible in DB.
- Rev 2: new eyebrow, use-cases visual, dashboard mock (feed rotates), process, comparison + stack tables, pilot block all render; portal shows exactly 3 tabs; nav CTAs point to cal.com/sunnyrai/30min; footer links to /fractional-cxo; CXO page renders all sections and back-link returns home.

## Rev 4 (2026-08-16) — Auth + Razorpay live payments
- Unified auth: JWT email/password (bcrypt, 15-min access + 7-day refresh httpOnly cookies, 5-attempt/15-min lockout) + Emergent-managed Google OAuth (AuthCallback exchanges session_id → session_token cookie). Custom user_id UUIDs, _id never exposed.
- Login UI: AuthModal (Google + email/password tabs) from nav "Log in" and automatically before any payment. Nav shows avatar + logout when signed in.
- Razorpay (LIVE keys in backend/.env): POST /api/payments/create-order (auth-gated, flexible ₹ amount) → Checkout.js modal → POST /api/payments/verify (HMAC signature) → db.payments marked paid.
- Pay surfaces: "Upgrade — pay now" unlocks on the generated plan card (info-first gating per user requirement), "Make a payment" on /dashboard. Amount modal with presets ₹4,999/₹9,999/₹24,999 + custom.
- /dashboard: Revenue collected KPI + payment signals in live feed; GET /api/payments public with masked emails.
- Verified: register/login/me curl chain, live Razorpay order created (order_TQMzBC4J1khkbp), 401 on unauthenticated order, UI signup → login → amount → Razorpay live checkout modal opened with prefill. Real charge NOT completed (live keys).

## Rev 5 (2026-08-16) — Receipts, webhook, priced packages
- Branded receipt email (stripe header, amount, package, payment ID) auto-sent to the payer on /api/payments/verify and on webhook capture (deduped via prior status check). Verified end-to-end via test send.
- Razorpay webhook: POST /api/payments/webhook handles payment.captured; verifies X-Razorpay-Signature when RAZORPAY_WEBHOOK_SECRET is set (env placeholder added, empty), and ALWAYS cross-checks payment via Razorpay API before marking paid (forgery-safe without secret). User must register this webhook URL in Razorpay dashboard.
- Priced packages (ASSUMED pricing, user to confirm): pilot tiers on plan card — Pilot Sprint ₹24,999 / Growth Pilot ₹49,999 / Full Engine Pilot ₹99,999; Fractional CXO hourly success packs — 25h ₹49,999 / 50h ₹94,999 / 100h ₹1,79,999 / 200h ₹3,39,999 (~₹2,000/hr with volume discounts). Custom amount still available everywhere.
- package_name stored on payment docs and shown in dashboard feed.
- Fix: auth/payment modals now render via createPortal (hover transforms were trapping the fixed overlay).

## Rev 6 (2026-08-16) — Real pricing, owner alerts, hours tracker
- CXO packs repriced to flat $30/hr (charged in INR ≈ ₹2,600/hr): 25h ₹65,000 / 50h ₹1,30,000 / 100h ₹2,60,000 / 200h ₹5,20,000. Order cap raised to ₹10,00,000. Pilot tiers unchanged (₹24,999/₹49,999/₹99,999 — still assumed).
- OWNER_EMAIL=ssup@sohighon.ai active: instant email alerts on every new brief AND every payment received (notify_owner_payment on verify + webhook).
- Hours Balance Tracker: /account page (login-gated) — hours remaining/used/invested KPIs, per-pack progress bars. Owner logs consumed hours via POST /api/account/log-hours (restricted to OWNER_EMAIL). Nav avatar links to /account.

## Backlog
- P0: (done) Cal.com booking link wired.
- P0: User action — register webhook https://purples-3.preview.emergentagent.com/api/payments/webhook (event: payment.captured) in Razorpay dashboard; paste webhook secret into RAZORPAY_WEBHOOK_SECRET for signature verification.
- P1: Confirm pilot tier pricing (₹24,999/₹49,999/₹99,999 assumed). Auth-protect /dashboard (currently public demo data).
- P1: Owner UI for logging hours (currently API-only, owner-gated).
- P1: Case studies / testimonials / client logos section (real proof points from user).
- P1: Connect pillar KPIs on /dashboard to real data sources (currently labeled sample).
- P2: Forgot/reset password flow; blog/insights hub for GEO; llms.txt; sitemap.xml/robots.txt.
- P2: OG share image (designed 1200x630) instead of logo.

## Rev 3 (2026-08-15) — Instant Plan Agent + alerts + live dashboard + motion upgrade
- Instant Plan Agent: POST /api/plan/stream (SSE) — saves brief as lead, detects+fetches website text (httpx, 4k chars), streams a tailored 3-pillar plan via gpt-5.4 (Emergent universal key), persists to plans collection. PromptBox renders streaming plan card with markdown formatting + "Build this with us" Cal.com CTA.
- Lead notifications: managed Resend proxy (EMERGENT_EMAIL_KEY), server-side template + guardrail gate, fires on every new brief. OWNER_EMAIL empty → alerts paused pending user's email.
- Live command center at /dashboard: real briefs/plans KPIs + auto-refreshing signal feed; landing "See the Dashboard" now links there.
- Motion: Lenis smooth scrolling (anchor-aware), masked line-by-line hero reveal, mouse-parallax brand orbs, editorial marquee strip, numbered chapter eyebrows (01–06), section scroll-reveals via Reveal wrapper.
