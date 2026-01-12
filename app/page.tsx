import type { Metadata } from "next";
import HomePage from "@/components/marketing/HomePage";

export const metadata: Metadata = {
  title: "MotorSafe — Gestion clients, véhicules & interventions pour garages",
  description:
    "MotorSafe centralise vos clients, véhicules et interventions. Recherche rapide, génération PDF, conformité et traçabilité. Gagnez du temps, inspirez confiance.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MotorSafe — Le panel premium pour garages",
    description:
      "Centralisez clients, véhicules, interventions et documents PDF. Interface premium, rapide, conçue pour les pros.",
    url: "/",
    siteName: "MotorSafe",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MotorSafe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MotorSafe — Gestion premium pour garages",
    description:
      "Clients, véhicules, interventions, PDF & conformité. Une interface pro pensée pour gagner du temps.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MotorSafe",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Plateforme SaaS pour garages : gestion clients, véhicules, interventions, traçabilité, conformité et génération PDF.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage />
    </>
  );
}
