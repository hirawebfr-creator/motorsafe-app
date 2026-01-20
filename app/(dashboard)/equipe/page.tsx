"use client";

/**
 * MULTI-USER-ROLES-01: Team Management Page
 * 
 * Displays team members, allows inviting new members,
 * changing roles, and disabling members.
 */

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { useUser } from "@/components/user-context";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Crown,
  Briefcase,
  Wrench,
  Phone,
  Eye,
  Mail,
} from "lucide-react";

// === Types ===

type MemberStatus = "INVITED" | "ACTIVE" | "DISABLED";
type GarageRole = "OWNER" | "MANAGER" | "STAFF" | "RECEPTION" | "READONLY";

interface TeamMember {
  id: string;
  userId: string | null;
  email: string;
  role: GarageRole;
  status: MemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
  disabledAt: string | null;
}

interface TeamQuota {
  current: number;
  max: number;
  canInvite: boolean;
}

// === Role Config ===

const ROLE_CONFIG: Record<GarageRole, { label: string; icon: React.ReactNode; color: string }> = {
  OWNER: { label: "Propriétaire", icon: <Crown size={14} />, color: "var(--ms-warning)" },
  MANAGER: { label: "Chef d'atelier", icon: <Briefcase size={14} />, color: "var(--ms-primary)" },
  STAFF: { label: "Mécanicien", icon: <Wrench size={14} />, color: "var(--ms-success)" },
  RECEPTION: { label: "Réception", icon: <Phone size={14} />, color: "var(--ms-accent)" },
  READONLY: { label: "Consultation", icon: <Eye size={14} />, color: "var(--ms-text-secondary)" },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  ACTIVE: { label: "Actif", variant: "success" },
  INVITED: { label: "Invité", variant: "warning" },
  DISABLED: { label: "Désactivé", variant: "neutral" },
};

// === Helpers ===

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// === Main Component ===

export default function TeamPage() {
  const user = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [quota, setQuota] = useState<TeamQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<GarageRole>("STAFF");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role change state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Erreur de chargement");
      }
      const data = await res.json();
      setMembers(data.data?.members || []);
      setQuota(data.data?.quota || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Invite handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur lors de l'invitation");
      }

      // Reset form and close modal
      setInviteEmail("");
      setInviteRole("STAFF");
      setInviteMessage("");
      setShowInviteModal(false);
      await fetchTeam();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInviting(false);
    }
  };

  // Role change handler
  const handleRoleChange = async (memberId: string, newRole: GarageRole) => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur");
      }
      await fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
      setEditingMemberId(null);
    }
  };

  // Disable handler
  const handleDisable = async (memberId: string) => {
    if (!confirm("Désactiver ce membre ? Il ne pourra plus accéder au garage.")) return;
    
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Désactivé par admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur");
      }
      await fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  // Check if current user can manage team
  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = user?.role === "ADMIN" || currentMember?.role === "OWNER" || currentMember?.role === "MANAGER";

  return (
    <div className="grid gap-6 ms-animate-slide-up">
      <SectionHeader
        title="Équipe"
        description="Gérez les membres de votre garage"
        level={1}
        action={
          <div className="flex items-center gap-3">
            {quota && (
              <div className="text-sm text-muted2">
                <span className="font-semibold">{quota.current}</span>
                <span> / {quota.max === Infinity ? "∞" : quota.max} membres</span>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={fetchTeam}>
              <RefreshCw size={14} className="mr-1" />
              Actualiser
            </Button>
            {canManage && quota?.canInvite && (
              <Button size="sm" onClick={() => setShowInviteModal(true)}>
                <UserPlus size={14} className="mr-1" />
                Inviter
              </Button>
            )}
          </div>
        }
      />

      {/* Quota warning */}
      {quota && !quota.canInvite && canManage && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <Shield size={20} className="text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Limite d'utilisateurs atteinte</p>
            <p className="text-sm text-amber-700">
              Passez au plan supérieur pour inviter plus de membres.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => window.location.href = "/billing"}>
            Voir les plans
          </Button>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <EmptyState
          title="Aucun membre"
          description="Invitez votre équipe pour collaborer sur vos dossiers."
          icon={<Users size={48} className="text-muted2" />}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--ms-bg-subtle)] border-b border-[var(--ms-border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Membre</th>
                  <th className="px-4 py-3 text-left font-medium">Rôle</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-left font-medium">Depuis</th>
                  {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ms-border)]">
                {members.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const statusConfig = STATUS_CONFIG[member.status];
                  const isCurrentUser = member.userId === user?.id;
                  const isOwner = member.role === "OWNER";
                  const canEdit = canManage && !isOwner && !isCurrentUser && member.status !== "DISABLED";

                  return (
                    <tr key={member.id} className={member.status === "DISABLED" ? "opacity-50" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[var(--ms-primary-light)] flex items-center justify-center text-[var(--ms-primary)] font-medium">
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {member.email}
                              {isCurrentUser && (
                                <span className="text-xs text-muted2">(vous)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingMemberId === member.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as GarageRole)}
                            className="ms-input py-1 text-sm"
                            disabled={actionLoading === member.id}
                          >
                            <option value="MANAGER">Chef d'atelier</option>
                            <option value="STAFF">Mécanicien</option>
                            <option value="RECEPTION">Réception</option>
                            <option value="READONLY">Consultation</option>
                          </select>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                            style={{ color: roleConfig.color, background: `${roleConfig.color}15` }}
                          >
                            {roleConfig.icon}
                            {roleConfig.label}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant}>
                          {member.status === "ACTIVE" && <CheckCircle2 size={12} className="mr-1" />}
                          {member.status === "INVITED" && <Clock size={12} className="mr-1" />}
                          {member.status === "DISABLED" && <XCircle size={12} className="mr-1" />}
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted2">
                        {member.status === "ACTIVE" ? formatDate(member.acceptedAt) : formatDate(member.invitedAt)}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-2">
                              {editingMemberId === member.id ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingMemberId(null)}
                                >
                                  Annuler
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setEditingMemberId(member.id)}
                                    disabled={actionLoading === member.id}
                                  >
                                    Modifier rôle
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDisable(member.id)}
                                    disabled={actionLoading === member.id}
                                    className="text-[var(--ms-error)]"
                                  >
                                    Désactiver
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Permissions reference */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} />
          Permissions par rôle
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--ms-border)]">
              <tr>
                <th className="text-left py-2 pr-4">Permission</th>
                <th className="text-center py-2 px-2">
                  <Crown size={14} className="mx-auto text-[var(--ms-warning)]" />
                </th>
                <th className="text-center py-2 px-2">
                  <Briefcase size={14} className="mx-auto text-[var(--ms-primary)]" />
                </th>
                <th className="text-center py-2 px-2">
                  <Wrench size={14} className="mx-auto text-[var(--ms-success)]" />
                </th>
                <th className="text-center py-2 px-2">
                  <Phone size={14} className="mx-auto text-[var(--ms-accent)]" />
                </th>
                <th className="text-center py-2 px-2">
                  <Eye size={14} className="mx-auto" />
                </th>
              </tr>
              <tr className="text-xs text-muted2">
                <th></th>
                <th className="py-1">Proprio</th>
                <th className="py-1">Manager</th>
                <th className="py-1">Mécano</th>
                <th className="py-1">Réception</th>
                <th className="py-1">Lecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ms-border-light)]">
              {[
                { name: "Clients", perms: [true, true, true, true, true] },
                { name: "Véhicules", perms: [true, true, true, true, true] },
                { name: "Interventions", perms: [true, true, true, false, false] },
                { name: "Documents", perms: [true, true, true, false, false] },
                { name: "Devis/Factures", perms: [true, true, false, true, false] },
                { name: "Planning", perms: [true, true, true, true, true] },
                { name: "Billing/Paiements", perms: [true, true, false, false, false] },
                { name: "Paramètres", perms: [true, false, false, false, false] },
                { name: "Équipe", perms: [true, true, false, false, false] },
                { name: "Export ZIP", perms: [true, true, false, false, false] },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="py-2 pr-4">{row.name}</td>
                  {row.perms.map((p, i) => (
                    <td key={i} className="text-center py-2">
                      {p ? (
                        <CheckCircle2 size={14} className="mx-auto text-[var(--ms-success)]" />
                      ) : (
                        <XCircle size={14} className="mx-auto text-muted2" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--ms-bg)] rounded-xl shadow-lg w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus size={20} />
              Inviter un membre
            </h2>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="membre@exemple.com"
                  required
                  className="ms-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rôle *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as GarageRole)}
                  className="ms-input w-full"
                >
                  <option value="MANAGER">Chef d'atelier</option>
                  <option value="STAFF">Mécanicien</option>
                  <option value="RECEPTION">Réception</option>
                  <option value="READONLY">Consultation seule</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message (optionnel)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Message personnel pour l'invitation..."
                  className="ms-input w-full min-h-[80px]"
                />
              </div>

              {inviteError && (
                <div className="p-3 rounded-lg bg-[var(--ms-error-light)] text-[var(--ms-error)] text-sm">
                  {inviteError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={inviting || !inviteEmail}>
                  {inviting ? (
                    <>
                      <RefreshCw size={14} className="mr-1 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail size={14} className="mr-1" />
                      Envoyer l'invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
