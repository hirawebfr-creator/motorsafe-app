"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import ReactMarkdown from "react-markdown";

interface Subprocessor {
  id: string;
  name: string;
  purpose: string;
  region: string;
  linkUrl: string | null;
  isActive: boolean;
}

interface LegalDocData {
  doc: {
    id: string;
    slug: string;
    title: string;
    scope: string;
  };
  version: {
    id: string;
    versionNumber: number;
    effectiveAt: string;
    bodyMarkdown: string;
    sha256: string;
    publishedAt: string;
  };
  allVersions: { id: string; versionNumber: number; effectiveAt: string }[];
}

export default function PrivacyPolicyPage() {
  const [data, setData] = useState<LegalDocData | null>(null);
  const [subprocessors, setSubprocessors] = useState<Subprocessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/legal/docs/politique-confidentialite").then((res) => res.json()),
      fetch("/api/legal/subprocessors").then((res) => res.json()),
    ])
      .then(([docJson, subJson]) => {
        if (docJson.ok) {
          setData(docJson.data);
        } else {
          setError(docJson.error || "Document non trouvé");
        }
        if (subJson.ok) {
          setSubprocessors(subJson.data.filter((s: Subprocessor) => s.isActive));
        }
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-bg text-text">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface rounded w-1/3"></div>
            <div className="h-4 bg-surface rounded w-full"></div>
            <div className="h-4 bg-surface rounded w-5/6"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen w-full bg-bg text-text">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-4">Politique de confidentialité</h1>
            <p className="text-muted2">Ce document n&apos;est pas encore disponible.</p>
            <p className="text-sm text-muted2 mt-2">Revenez plus tard ou contactez-nous.</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Retour à l&apos;accueil
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  const effectiveDate = new Date(data.version.effectiveAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen w-full bg-bg text-text">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/legal" className="text-sm text-muted2 hover:text-primary">
            ← Retour aux informations légales
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">{data.doc.title}</h1>
          <p className="mt-2 text-sm text-muted2">
            Version {data.version.versionNumber} — En vigueur depuis le {effectiveDate}
          </p>
        </div>

        {/* Content */}
        <Card className="p-8">
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{data.version.bodyMarkdown}</ReactMarkdown>
          </article>
        </Card>

        {/* Subprocessors list */}
        {subprocessors.length > 0 && (
          <Card className="mt-8 p-8">
            <h2 className="text-xl font-semibold mb-4">Sous-traitants autorisés</h2>
            <p className="text-sm text-muted2 mb-4">
              Liste des sous-traitants qui traitent vos données personnelles pour notre compte :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium">Sous-traitant</th>
                    <th className="text-left py-2 px-3 font-medium">Finalité</th>
                    <th className="text-left py-2 px-3 font-medium">Région</th>
                  </tr>
                </thead>
                <tbody>
                  {subprocessors.map((sp) => (
                    <tr key={sp.id} className="border-b border-border/50">
                      <td className="py-2 px-3">
                        {sp.linkUrl ? (
                          <a
                            href={sp.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {sp.name}
                          </a>
                        ) : (
                          sp.name
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted2">{sp.purpose}</td>
                      <td className="py-2 px-3 text-muted2">{sp.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Version history */}
        {data.allVersions.length > 1 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted2 mb-2">Historique des versions</h2>
            <div className="flex flex-wrap gap-2">
              {data.allVersions.map((v) => (
                <Link
                  key={v.id}
                  href={`/politique-confidentialite?version=${v.versionNumber}`}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    v.versionNumber === data.version.versionNumber
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  v{v.versionNumber}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Integrity hash */}
        <div className="mt-8 text-xs text-muted2 text-center">
          <p>Hash d&apos;intégrité: {data.version.sha256.substring(0, 16)}...</p>
        </div>
      </div>
    </main>
  );
}
