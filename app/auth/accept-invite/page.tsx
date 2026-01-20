"use client";

/**
 * MULTI-USER-ROLES-01: Accept Team Invitation Page
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/common/Loading";
import { Users, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  email: string;
  role: string;
  garageName: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Chef d'atelier",
  STAFF: "Mécanicien",
  RECEPTION: "Réception",
  READONLY: "Consultation",
};

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--ms-bg-subtle)]">
        <Loading />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token d'invitation manquant");
      setLoading(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/team/accept?token=${token}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data?.error?.message || "Invitation invalide ou expirée");
        }

        setInviteInfo(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de validation");
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);

    if (password.length < 8) {
      setAcceptError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setAcceptError("Les mots de passe ne correspondent pas");
      return;
    }

    setAccepting(true);

    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur lors de l'acceptation");
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ms-bg-subtle)]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ms-bg-subtle)] p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle size={48} className="mx-auto text-[var(--ms-error)] mb-4" />
          <h1 className="text-xl font-bold mb-2">Invitation invalide</h1>
          <p className="text-muted2 mb-6">{error}</p>
          <Button onClick={() => router.push("/auth/login")}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ms-bg-subtle)] p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto text-[var(--ms-success)] mb-4" />
          <h1 className="text-xl font-bold mb-2">Bienvenue !</h1>
          <p className="text-muted2 mb-4">
            Vous avez rejoint l'équipe de <strong>{inviteInfo?.garageName}</strong>
          </p>
          <p className="text-sm text-muted2">Redirection vers le tableau de bord...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ms-bg-subtle)] p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[var(--ms-primary-light)] flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-[var(--ms-primary)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Rejoindre l'équipe</h1>
          <p className="text-muted2">
            <strong>{inviteInfo?.garageName}</strong> vous invite à rejoindre son équipe
            en tant que <strong>{ROLE_LABELS[inviteInfo?.role || ""] || inviteInfo?.role}</strong>
          </p>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={inviteInfo?.email || ""}
              disabled
              className="ms-input w-full bg-[var(--ms-bg-subtle)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
              className="ms-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmer le mot de passe *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              className="ms-input w-full"
            />
          </div>

          {acceptError && (
            <div className="p-3 rounded-lg bg-[var(--ms-error-light)] text-[var(--ms-error)] text-sm">
              {acceptError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={accepting}>
            {accepting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Création du compte...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Accepter l'invitation
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted2 mt-6">
          En acceptant, vous acceptez les conditions d'utilisation de MotorSafe.
        </p>
      </Card>
    </div>
  );
}
