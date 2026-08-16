import Account from "@/components/Account";

export const metadata = {
  title: "My Account · High On AI",
  description: "Your packs, hours balance and payments, live.",
  alternates: { canonical: "/account" },
  openGraph: {
    title: "My Account · High On AI",
    description: "Your packs, hours balance and payments, live.",
  },
  twitter: {
    title: "My Account · High On AI",
    description: "Your packs, hours balance and payments, live.",
  },
};

export default function AccountPage() {
  return <Account />;
}
