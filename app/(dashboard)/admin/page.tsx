"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUser } from "@/components/user-context";
import { fetcher, requestJson } from "@/lib/fetcher";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
// import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { SectionHeader } from "@/components/ui/SectionHeader";

type GarageItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; createdAt: string }>;
};

export default function AdminPendingPage() {
  const user = useUser();
  if (!user) return null;
  const [garages, setGarages] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(user.role === "ADMIN");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<GarageItem | null>(null);
  const isAdmin = user.role === "ADMIN";
  const toast = useToast();

  useEffect(() => {
    if (isAdmin) return;
    const stored = window.localStorage.getItem("ms_admin_key");
    if (stored) {
      setAdminKey(stored);
      setKeyReady(true);
    }
  }, [isAdmin]);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher<GarageItem[]>("/api/admin/garages?status=pending", {
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      setGarages(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: number) => {
    setError(null);
    try {
      await requestJson(`/api/admin/garages/${id}/approve`, {
        method: "POST",
        body: {},
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      toast.push({
        title: "Garage approuve",
        description: "Le compte est maintenant actif.",
        variant: "success",
      });
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    }
  };

  const openReject = (garage: GarageItem) => {
    setRejectTarget(garage);
    setRejectReason("");
    setRejectOpen(true);
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setError(null);
    try {
      await requestJson(`/api/admin/garages/${rejectTarget.id}/reject`, {
        method: "POST",
        body: { reviewNote: rejectReason },
        noStore: true,
        headers: !isAdmin && adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      toast.push({
        title: "Garage refuse",
        description: "La demande a ete refusee.",
        variant: "info",
      });
      await loadPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur.";
      setError(message);
      toast.push({ title: "Erreur", description: message, variant: "error" });
    } finally {
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  useEffect(() => {
    if (keyReady) {
      loadPending();
    }
  }, [keyReady]);

  if (!keyReady && !isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Acces reserve a l'administration. Renseignez votre ADMIN_KEY pour continuer.
        </p>
        <div className="mt-4 grid gap-3">
          <input
            className="input"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="ADMIN_KEY"
          />
          <Button
            onClick={() => {
              if (!adminKey.trim()) return;
              window.localStorage.setItem("ms_admin_key", adminKey.trim());
              setKeyReady(true);
            }}
          >
            Deverrouiller
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionHeader
        title="Demandes en attente"
        description="Gérez les demandes d'inscription des garages. Approvez ou refusez avec un motif."
        action={
          <Link href="/admin/garages" className="text-sm text-[var(--accent-2)] hover:underline">
            Voir tous les garages
          </Link>
        }
        level={1}
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Loading />
      ) : garages.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les demandes en attente apparaitront ici." />
      ) : (
        <div className="grid gap-4">
          {garages.map((garage) => (
            <Card key={garage.id} className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--text)]">{garage.name}</p>
                  <p className="text-xs text-[var(--muted)]">{garage.email}</p>
                </div>
                <Badge variant="warning">En attente</Badge>
              </div>
              <div className="grid gap-2 text-sm text-[var(--muted)]">
                <p>Téléphone : {garage.phone || "-"}</p>
                <p>Adresse : {garage.address || "-"}</p>
                <p>SIRET : {garage.siret || "-"}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--muted)]">
                  Responsable : {garage.users[0]?.email ?? "-"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => openReject(garage)}>
                    Refuser
                  </Button>
                  <Button onClick={() => approve(garage.id)}>Approuver</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Refuser la demande"
        description={rejectTarget ? `Motif pour ${rejectTarget.name}` : undefined}
        confirmLabel="Refuser"
        confirmVariant="destructive"
        onConfirm={reject}
      >
        <Textarea
          label="Motif"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Expliquer la raison du refus."
        />
      </Dialog>
    </div>
  );
}
