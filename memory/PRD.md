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

## Rev 6b (2026-08-16) — Low-balance alerts + owner hours UI
- Low-balance alerts: logging hours that drops a pack below 5 remaining auto-emails the client a top-up email (links to /fractional-cxo), once per pack (low_balance_notified flag).
- Owner hours UI: /account shows an "Owner tools" section (only when logged in as OWNER_EMAIL) — lists all paid packs with remaining-hours badges (red under 5) and per-pack log inputs. Backed by GET /api/account/all-payments (owner-only).
- Pilot pricing confirmed as-is by user (₹24,999/₹49,999/₹99,999).
- Note: email proxy blocks undeliverable recipients (fake domains like demo@highonai.dev get 422 — correct guard; real customer emails deliver).
- Verified: owner flow e2e (registered temp owner, logged 21h → 4 remaining → alert triggered + flag set; UI log 0.5h → 3.5; temp owner user deleted after test).
- Google sign-in (Emergent-managed OAuth) verified live: "Continue with Google" → auth.emergentagent.com → real Google accounts sign-in page; backend session exchange rejects missing/invalid session IDs correctly. Post-Google-account callback untested (needs a real Google account).

## Rev 7 (2026-08-16) — Hero keyword field, visual process demo, copy rules
- Hero: grid background replaced with a floating 3D keyword field (KeywordField.jsx) — ChatGPT/Gemini/Perplexity/Claude/GEO/AEO/LLM SEO/AI Overviews/Citations/Share of Voice/Entity Graph/Answer Engine chips at 3 depth layers (blur+opacity+scale), per-token mouse parallax, slow float loops, container perspective tilt. Eyebrow enlarged (text-sm/base, thicker stripe bars).
- "GEO Leads" renamed to "LLM Revenue" (portal tab, hero chip, footer link).
- Editorial marquee removed; "Be the answer AI gives" (UseCases) section removed.
- Process section moved to position 01 and reworked: left = heading + compact numbered steps; right = self-playing DemoCard that types a website + goal, spins up, and reveals a staggered plan output on a ~14s loop (static final state under reduced motion).
- Em dash (—) banned: swept all src/, public/index.html, backend server.py emails/prompts; zero remain.
- Verified: hero keyword field + bigger eyebrow render; demo types → generates → shows plan lines; portal tabs = LLM Revenue/AI Videos/Voice AI; marquee & use-cases gone (count 0); backend healthy post-sed.

## Rev 8 (2026-08-16) — Success pack table + project estimator + stack calculator
- /fractional-cxo packs section replaced with Odoo-style comparison table (SuccessPacks.jsx): 4 brand-colored tier columns (Starter orange / Momentum cyan / Scale green / Embedded purple), 9-row feature matrix with per-column checks, investment row with Book buttons (PayButton, Razorpay).
- Project Estimator (Estimator.jsx, purple "Project Estimator" button): company size input + 5 need checkboxes (GEO 20h, video 15h, outbound/voice 15h, CXO 25h, RevOps 8h) with size multipliers (1x/1.2x/1.4x/1.6x) → estimated hours, ₹ cost at flat $30/hr (₹2,600), recommended pack with one-click Book (auth-gated, preselected) or Cal.com link. Modal layering fixed (auth z-100, payment z-110 above estimator z-95).
- "The stack you'd otherwise need" static table replaced with interactive StackCalculator.jsx (Odoo-style): 18 selectable tool tiles with brand-color monograms across 6 categories, users stepper (per-user vs flat pricing), live "Tools to replace" ledger, yearly total vs ₹99,999 Full Engine Pilot, yellow-highlighted yearly savings. Verified interactively (totals recompute on tool/user changes).

## Rev 9 (2026-08-16) — Market-calibrated pricing (researched Aug 2026)
- StackCalculator repriced from published 2026 competitor pricing: Profound $399 / Peec €205 / AthenaHQ $295 / Otterly $189 / HeyGen $69 per seat / Synthesia $89 / Arcads $110 / Apollo $59 per seat / Clay $149 / Smartlead $94 / Outreach ~$115 per seat / impact.com $500 / PartnerStack ~$1k / GRIN $1.5k / CreatorIQ $3k+ / Aspire $2k / Clari ~$75 per seat (INR at ~₹87/USD). Right panel reframed: monthly stack total vs High On AI engine ₹1,30,000/mo (50 hrs flat $30/hr) with yearly savings + % (52% at defaults).
- Estimator: each need now carries a researched market benchmark for equivalent agency+tools scope (GEO ₹2.2L, video ₹1.6L, outbound/voice ₹1.3L, fractional CXO ₹2.6L, RevOps ₹1L) — result panel shows "Agencies + tools ≈ ₹X" and "You save ~N%" (verified 65-75% band across selections).

## Rev 10 (2026-08-16) — AI concierge + Odoo-style nav
- ChatBot.jsx: floating concierge on every page (black launcher with live dot, streaming SSE replies via POST /api/chat/stream, session persisted in localStorage, suggestion chips, clickable links, consultative tone).
- Backend: BOT_BASE_PROMPT holds full business ground truth (pillars, packs, pilots, pricing, process, positioning, booking link, behavior rules); conversation transcript (last 8) included per turn; chats stored in db.chats.
- Owner teaching: POST/GET/DELETE /api/chat/teach (owner-only) stored in db.bot_knowledge and injected into the system prompt as ground truth. UI in OwnerTools ("Train the AI concierge") on /account. Verified: taught fact was used by the bot in its next answer; test data cleaned up.
- Nav reworked to Odoo-style: Services / Pricing (/fractional-cxo#cxo-packs, hash scroll fixed in ScrollToTop) / Command Center / Help.

## Rev 11 (2026-08-16) — Service visuals in hero + chat lead capture
- KeywordField expanded beyond LLM names: service chips with lucide icons (AI Video, Voice AI, AI SDR, Social Media, Outbound, UGC Ads, Booked Meetings) mixed with LLM/GEO tokens, all in the 3-depth parallax field.
- Concierge lead capture: bot now asks for name + work email on buying intent (system prompt); backend detects emails in visitor messages, saves a lead (source=concierge_chat, email field, dedupe), fires owner alert, and emits a captured SSE event → visitor sees a confirmation toast. Verified e2e (lead saved, owner alerted, dedupe), test data cleaned.
- Lead model now carries optional email field.

## Rev 12 (2026-08-16) — Hero video wall
- KeywordField reworked from LLM chips to floating UGC/ad video cards (Founder UGC ad, Product demo, Customer story with LIVE badge, Ad creative V3, Launch teaser, AI avatar ad): play buttons, duration badges, view counts, simulated playback via animated progress bars + light-sweep flash, per-card brand tint. Only 5 LLM/GEO chips remain for flavor. Depth layers + mouse parallax retained; static frames under reduced motion.

## Rev 13 (2026-08-16) — Typography sweep
- Demo window header: traffic-light dots replaced with stripe-gradient bar; "highon.ai · instant plan" now semibold sans.
- font-mono (JetBrains Mono) removed from every component site-wide (eyebrows, chips, badges, dashboard labels, feeds now render in Inter/Outfit). Zero font-mono classes remain.

## Rev 14 (2026-08-16) — Pricing reorder + lean hero
- Success packs table moved to the top of /fractional-cxo (immediately after the hero).
- Packs now: Trial 4h ₹10,400 (red) · Starter 25h ₹65,000 (orange) · Momentum 50h ₹1,30,000 (cyan) · Scale 100h ₹2,60,000 (green). 200h Embedded removed everywhere (table, PayButton packages, feature matrix re-flagged to 4 columns).
- Hero background reduced to exactly two video cards (Founder UGC ad, Ad creative V3); small chips retained.

## Rev 15 (2026-08-16) — Trial Pack promotion + hero visibility fixes
- Pilot section now features "Lowest-friction start: Trial Pack · 4 hours · ₹10,400" with a working green PayButton (preselected in payment modal).
- Hero field rebalanced: ChatGPT/GEO/AI SDR moved to sharp near layer (were blurred at depth 0.6); GEO relocated out from behind the sticky nav; lower-left empty space filled with Perplexity + AI SDR chips; UGC Ads added mid-left. Two video cards retained.

## Rev 16 (2026-08-16) — Real video in hero
- Lead hero card ("Engine showreel") now plays an actual looping clip: brand-stripe motion graphic rendering "Get Cited. Get Watched. Get Chosen." over the logo stripes, rendered locally to /public/hero-ad.mp4 (H.264) + hero-ad.webm (VP9 fallback for open-source Chromium). Muted, autoplay, loop, playsInline with explicit play() on canPlay. Verified playing (currentTime advanced) in the test browser. User can replace /public/hero-ad.* with real ad creative later.

## Rev 17 (2026-08-16) — Hero clip swapped
- hero-ad.mp4/webm replaced with a hook-style ad concept: "94% of buyers ask AI first. Does it name you?" (magenta stat, blue punchline, shimmering stripe bar, "high on ai" sign-off). Verified playing in-browser (clock advancing, loop restarts).

## Rev 18 (2026-08-16) — Full services lineup in portal
- Services portal expanded from 3 to 7 motions: LLM Revenue, AI Videos, Voice AI + new AI SDR (red, sequence/reply panel), Social Media (cyan, weekly content grid), UGC Ads (purple, creative A/B/C testing with winner), Affiliate & Partners (orange, partner pipeline feed). Eyebrow updated to "One engine. Every growth motion." All tabs verified rendering and cycling.

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
