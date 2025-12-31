import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ComplianceToggles } from "@/components/parametres/ComplianceToggles";

export const runtime = "nodejs";

export default async function ParametresPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (!isApprovedGarage(user)) redirect("/pro/en-attente");

  const garage = user.role === "ADMIN"
    ? null
    : await prisma.garage.findUnique({ where: { id: user.garageId ?? -1 } });

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Parametres</p>
        <h1 className="mt-3 text-3xl font-semibold">Identite & conformite</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Centralisez les informations legales et les preferences de votre atelier.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="grid gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Profil garage</p>
              <h2 className="mt-2 text-xl font-semibold">{garage?.name ?? "Administration"}</h2>
            </div>
            <Badge variant="accent">{user.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
          <div className="grid gap-2 text-sm text-[var(--muted)]">
            <p>Email: {garage?.email ?? user.email}</p>
            <p>Telephone: {garage?.phone || "-"}</p>
            <p>Adresse: {garage?.address || "-"}</p>
            <p>SIRET: {garage?.siret || "-"}</p>
            <p>
              Statut:{" "}
              {user.role === "ADMIN"
                ? "Administration"
                : garage?.status === "ACTIVE"
                ? "Actif"
                : garage?.status === "REJECTED"
                ? "Refuse"
                : "En attente"}
            </p>
          </div>
        </Card>

        <Card className="grid gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Conformite</p>
            <h2 className="mt-2 text-xl font-semibold">Assurance & traceabilite</h2>
          </div>
          <ComplianceToggles />
          <Badge variant="success">Conformite active</Badge>
        </Card>
      </div>
    </div>
  );
}
