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

## Implemented (2026-08-15)
- Sticky glass nav with logo, anchor links, "Book a growth call" CTA, mobile menu.
- Hero: eyebrow, H1 with stripe-gradient text, subheadline "New revenue from LLMs. Video that converts — 89% of buyers say it seals the deal.", prompt-box CTA (typewriter phrases ~4s cycle, 4 quick-action chips, POST /api/leads + sonner toast), reassurance line "No pitch deck. A 20-minute working session and a written 90-day plan." (2026-08-15 revision replaced the 94% stat callout per user request).
- Services portal: 4 pill tabs auto-cycling every 3s (GEO Leads blue, AI Videos magenta, Voice AI green, Fractional CXO orange), each with mock product UI panel and per-service CTA.
- "Why now" stats strip (94%, 3–4, 2–4 wks, 10–20 hrs).
- FAQ: 6 genuine GEO/LLM Q&As, animated accordion, matching FAQPage JSON-LD in head.
- Footer: link columns, "Powered by QuantumAI OS Pvt Ltd", copyright, stripe bar, glassy 40vh "high on ai" brand wall.
- Backend: POST/GET /api/leads (MongoDB persistence, validated).
- Accessibility: focus-visible rings, aria labels, keyboard-operable accordion/tabs, reduced-motion handling.

## Verified
- POST /api/leads + GET /api/leads via external URL (lead persisted).
- UI e2e via screenshots: hero render, portal auto-cycle (AI Videos → Voice AI), FAQ open, footer/brand wall, prompt submit with success toast, lead visible in DB.

## Backlog
- P0: Real contact email/calendar link for "Book a growth call" (currently anchors to prompt box).
- P1: Admin view for captured leads; email notification on new lead (Resend).
- P1: Case studies / testimonials / client logos section (real proof points from user).
- P2: Blog/insights hub for GEO content moat; per-service detail pages; llms.txt file; sitemap.xml/robots.txt.
- P2: OG share image (designed 1200x630) instead of logo.
