import CommandCenter from "@/components/CommandCenter";

export const metadata = {
  title: "Command Center · High On AI",
  description: "Every pillar, one live view. Briefs, plans, payments and signals in real time.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "Command Center · High On AI",
    description: "Every pillar, one live view. Briefs, plans, payments and signals in real time.",
  },
  twitter: {
    title: "Command Center · High On AI",
    description: "Every pillar, one live view. Briefs, plans, payments and signals in real time.",
  },
};

export default function DashboardPage() {
  return <CommandCenter />;
}
