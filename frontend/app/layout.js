import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://purples-3.preview.emergentagent.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "High On AI · Human Intelligence + AI Growth Engine | GEO, AI Video, Voice AI, Fractional CXO",
  description:
    "High On AI deploys the full-stack H.I.A.I. engine · human intelligence plus AI · for marketing, sales, and growth. Get your brand cited by ChatGPT, Gemini and Perplexity, ship AI video at scale, book meetings with Voice AI, and hire a Fractional AI Marketing CXO. Powered by QuantumAI OS Pvt Ltd.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "High On AI · Human Intelligence + AI Growth Engine",
    description:
      "New revenue from LLMs. Video that converts · 89% of buyers say it seals the deal. High On AI deploys the full-stack human intelligence + AI growth engine.",
    images: ["/logo.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "High On AI · Human Intelligence + AI Growth Engine",
    description: "GEO leads, AI video, Voice AI and a Fractional AI Marketing CXO · one growth engine, deployed in weeks.",
  },
  icons: { icon: "/fevicon.webp", apple: "/fevicon.webp" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "High On AI",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.webp`,
      description:
        "High On AI is a creative AI-powered marketing agency deploying the full-stack H.I.A.I. engine · human intelligence plus AI · for marketing, sales and growth. Services include GEO (getting brands cited by ChatGPT, Gemini and Perplexity), AI video production, Voice AI agents and fractional AI marketing CXO leadership.",
      parentOrganization: { "@type": "Organization", name: "QuantumAI OS Pvt Ltd" },
      knowsAbout: ["Generative Engine Optimization", "AI marketing", "Voice AI", "AI video generation", "Fractional CMO"],
      slogan: "Human intelligence + AI for marketing, sales, and growth.",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is GEO, and how is it different from SEO?",
          acceptedAnswer: { "@type": "Answer", text: "GEO (Generative Engine Optimization) is the practice of making your brand the answer AI engines give. SEO competes for ten blue links on Google; GEO competes for the 3-4 brand citations inside a ChatGPT, Gemini, or Perplexity answer. High On AI optimizes your content, entity signals, and structured data so LLMs can find, trust, and quote you." },
        },
        {
          "@type": "Question",
          name: "How do I get my brand cited by ChatGPT, Gemini, and Perplexity?",
          acceptedAnswer: { "@type": "Answer", text: "AI engines cite brands that publish clear, structured, entity-rich content and earn mentions across trusted sources. Our GEO program rewrites your key pages into LLM-quotable answers, adds FAQPage and Organization schema, and builds the third-party citations LLMs cross-check before recommending a vendor." },
        },
        {
          "@type": "Question",
          name: "What does a Fractional AI Marketing CXO actually do?",
          acceptedAnswer: { "@type": "Answer", text: "A Fractional AI Marketing CXO owns your growth number part-time: positioning, demand generation, GEO, paid, and the AI stack that automates them. You get C-level strategy and hands-on execution for a fraction of a full-time hire, typically 10-20 hours per week." },
        },
        {
          "@type": "Question",
          name: "How fast can we see pipeline impact?",
          acceptedAnswer: { "@type": "Answer", text: "Quick wins · AI search citations, video output, and voice-agent meetings · typically appear within 2-4 weeks. Compounding GEO authority that consistently places you in AI answers usually builds over 60-90 days." },
        },
        {
          "@type": "Question",
          name: "Will AI replace our marketing team?",
          acceptedAnswer: { "@type": "Answer", text: "No. High On AI pairs human strategists with AI systems. AI handles research, production, and follow-up at scale; your team keeps judgment, relationships, and brand. Most clients redeploy 30-40% of manual marketing hours into higher-value work." },
        },
        {
          "@type": "Question",
          name: "How is High On AI different from a traditional agency?",
          acceptedAnswer: { "@type": "Answer", text: "Traditional agencies sell hours and headcount. High On AI deploys a full-stack H.I.A.I. engine · human intelligence plus AI · covering GEO, AI video, Voice AI, and fractional leadership in one operating system, so strategy and execution ship together every week." },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>{children}</Providers>
        <Script src="https://assets.emergent.sh/scripts/emergent-main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
