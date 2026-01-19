/**
 * INSURANCE-READY-EXPORT-02: Public Share Download Page
 * /share/export/[token]
 *
 * Landing page for shared export links.
 */

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, AlertTriangle, Clock, FileArchive, Shield, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Télécharger le dossier d'intervention | Motorsafe",
  description: "Téléchargez le dossier complet d'intervention exporté depuis Motorsafe",
  robots: "noindex, nofollow",
};

type Props = {
  params: Promise<{ token: string }>;
};

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export default async function ShareExportPage({ params }: Props) {
  const { token } = await params;

  // Validate token format
  if (!token || typeof token !== "string" || token.length !== 64) {
    return <InvalidLinkPage reason="invalid" />;
  }

  // Hash the token to find it in DB
  const tokenHash = sha256(token);

  // Find the download token
  const downloadToken = await prisma.downloadToken.findUnique({
    where: { tokenHash },
    include: {
      intervention: {
        include: {
          vehicle: { select: { plate: true, brand: true, model: true } },
          garage: { select: { displayName: true, name: true } },
        },
      },
    },
  });

  if (!downloadToken) {
    return <InvalidLinkPage reason="notfound" />;
  }

  if (downloadToken.purpose !== "INSURANCE_EXPORT") {
    return <InvalidLinkPage reason="invalid" />;
  }

  // Check expiry
  if (downloadToken.expiresAt < new Date()) {
    return <InvalidLinkPage reason="expired" expiresAt={downloadToken.expiresAt} />;
  }

  const intervention = downloadToken.intervention;
  if (!intervention || intervention.deletedAt) {
    return <InvalidLinkPage reason="notfound" />;
  }

  const garageName = intervention.garage?.displayName || intervention.garage?.name || "Garage";
  const vehicle = intervention.vehicle;
  const expiresAt = downloadToken.expiresAt;

  // Calculate days remaining
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileArchive className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Dossier d&apos;intervention
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Export partagé par <span className="font-medium">{garageName}</span>
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Dossier vérifié
            </CardTitle>
            <CardDescription>
              Ce dossier contient les documents officiels de l&apos;intervention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle info */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Véhicule concerné
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {vehicle.plate}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {vehicle.brand} {vehicle.model}
                  </p>
                </div>
              </div>
            </div>

            {/* Content description */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Contenu du dossier
              </h3>
              <ul className="space-y-2">
                {[
                  "Lettre d'accompagnement avec en-tête garage",
                  "Index des pièces avec empreintes SHA256",
                  "Documents signés électroniquement",
                  "Preuves de signature",
                  "Photos du véhicule",
                  "Chaîne de preuves cryptographique",
                  "Rapport d'intégrité",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Expiry warning */}
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                Ce lien expire dans <strong>{daysRemaining} jour{daysRemaining > 1 ? "s" : ""}</strong>
                {" "}({expiresAt.toLocaleDateString("fr-FR")})
              </span>
            </div>

            {/* Download button */}
            <a
              href={`/api/share/export/${token}`}
              className="block"
            >
              <Button className="w-full h-12 text-base" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Télécharger le dossier complet
              </Button>
            </a>

            <p className="text-xs text-center text-slate-500 dark:text-slate-500">
              Fichier ZIP contenant tous les documents • Intégrité vérifiable via SHA256
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-500">
          <p>Dossier généré par</p>
          <Link href="/" className="font-medium text-primary hover:underline">
            Motorsafe
          </Link>
          <p className="mt-1 text-xs">
            Gestion professionnelle de garage avec signature électronique
          </p>
        </div>
      </div>
    </div>
  );
}

function InvalidLinkPage({ reason, expiresAt }: { reason: "invalid" | "notfound" | "expired"; expiresAt?: Date }) {
  const messages = {
    invalid: {
      title: "Lien invalide",
      description: "Ce lien de partage n'est pas valide.",
    },
    notfound: {
      title: "Lien introuvable",
      description: "Ce lien de partage n'existe pas ou a été révoqué.",
    },
    expired: {
      title: "Lien expiré",
      description: expiresAt 
        ? `Ce lien a expiré le ${expiresAt.toLocaleDateString("fr-FR")}.`
        : "Ce lien de partage a expiré.",
    },
  };

  const { title, description } = messages[reason];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
      <div className="container max-w-md mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {description}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter le garage qui vous a envoyé ce lien.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button variant="outline">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
