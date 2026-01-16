import type { Metadata } from "next";
import PartnersPage from "./PartnersPage";

export const metadata: Metadata = {
  title: "Garages partenaires SafeMotor — Trouver un garage près de chez vous",
  description:
    "Découvrez les garages partenaires SafeMotor : des professionnels de confiance pour l'entretien et la réparation de votre véhicule. Recherchez par ville, code postal ou département.",
  alternates: { canonical: "/garages-partenaires" },
  openGraph: {
    title: "Garages partenaires SafeMotor",
    description:
      "Trouvez un garage partenaire SafeMotor près de chez vous. Des professionnels de confiance pour votre véhicule.",
    url: "/garages-partenaires",
    siteName: "SafeMotor",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Garages partenaires SafeMotor",
    description: "Liste des garages partenaires certifiés SafeMotor en France",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: 0, // Will be dynamic client-side
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PartnersPage />
    </>
  );
}
