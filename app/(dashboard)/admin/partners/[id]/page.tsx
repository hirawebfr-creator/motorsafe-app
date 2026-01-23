"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { ConfirmDialog as Dialog } from "@/components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Attribution {
  id: string;
  createdAt: string;
  source: string;
  refCodeUsed: string | null;
  couponCodeUsed: string | null;
  garage: {
    id: string;
    name: string;
    city: string | null;
    plan: string;
    subscriptionStatus: string | null;
    createdAt: string;
  };
}

interface CommissionLine {
  id: string;
  createdAt: string;
  invoiceAmountCents: number;
  commissionCents: number;
  commissionPercent: number;
  isValid: boolean;
  stripeInvoiceId: string;
}

interface Payout {
  id: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  status: string;
  paidAt: string | null;
}

interface PartnerDetail {
  id: string;
  name: string;
  email: string;
  type: string;
  refCode: string;
  stripeCouponId: string | null;
  commissionPercent: number;
  commissionMode: string;
  minPayoutCents: number;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
  attributions: Attribution[];
  commissionLines: CommissionLine[];
  payouts: Payout[];
}

const PARTNER_TYPES = [
  { value: "GARAGE", label: "Garage partenaire" },
  { value: "INFLUENCER", label: "Influenceur" },
  { value: "AGENCY", label: "Agence" },
  { value: "OTHER", label: "Autre" },
];

type TabKey = "settings" | "attributions" | "commissions" | "payouts";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [creatingPayout, setCreatingPayout] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("settings");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editType, setEditType] = useState("");
  const [editCommission, setEditCommission] = useState(20);
  const [editCouponId, setEditCouponId] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Payout form
  const [payoutStart, setPayoutStart] = useState("");
  const [payoutEnd, setPayoutEnd] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(0);

  const fetchPartner = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/partners/${id}`);
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPartner(data.partner);

      // Initialize form
      setEditName(data.partner.name);
      setEditEmail(data.partner.email);
      setEditType(data.partner.type);
      setEditCommission(data.partner.commissionPercent);
      setEditCouponId(data.partner.stripeCouponId || "");
      setEditActive(data.partner.isActive);
    } catch (error) {
      console.error("Error fetching partner:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartner();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          type: editType,
          commissionPercent: editCommission,
          stripeCouponId: editCouponId || null,
          isActive: editActive,
        }),
      });

      if (!res.ok) throw new Error("Erreur mise à jour");
      fetchPartner();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!payoutStart || !payoutEnd || !payoutAmount) return;

    try {
      setCreatingPayout(true);
      const res = await fetch(`/api/admin/partners/${id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: payoutStart,
          periodEnd: payoutEnd,
          amountCents: Math.round(payoutAmount * 100),
          status: "DUE",
        }),
      });

      if (!res.ok) throw new Error("Erreur création");
      setPayoutOpen(false);
      setPayoutStart("");
      setPayoutEnd("");
      setPayoutAmount(0);
      fetchPartner();
    } catch (error) {
      console.error("Error creating payout:", error);
      alert("Erreur création paiement");
    } finally {
      setCreatingPayout(false);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${id}/payout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId,
          status: "PAID",
        }),
      });

      if (!res.ok) throw new Error("Erreur mise à jour");
      fetchPartner();
    } catch (error) {
      console.error("Error marking paid:", error);
    }
  };

  const copyRefLink = () => {
    if (!partner) return;
    const link = `${window.location.origin}/pro/inscription?ref=${partner.refCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="container mx-auto py-6">
        <p>Partenaire non trouvé</p>
      </div>
    );
  }

  // Calculate stats
  const totalCommission = partner.commissionLines
    .filter((c) => c.isValid)
    .reduce((sum, c) => sum + c.commissionCents, 0);
  const totalPaid = partner.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const commissionDue = totalCommission - totalPaid;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "settings", label: "Paramètres" },
    { key: "attributions", label: "Attributions", count: partner.attributions.length },
    { key: "commissions", label: "Commissions", count: partner.commissionLines.length },
    { key: "payouts", label: "Paiements", count: partner.payouts.length },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-surface2 rounded" onClick={() => router.push("/admin/partners")}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{partner.name}</h1>
          <p className="text-muted2">{partner.email}</p>
        </div>
        <Badge variant={partner.isActive ? "success" : "neutral"}>
          {partner.isActive ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Affiliate Link */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Lien affilié</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-surface2 px-3 py-2 rounded text-sm overflow-x-auto">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/pro/inscription?ref=${partner.refCode}`}
          </code>
          <Button variant="secondary" size="sm" onClick={copyRefLink}>
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm font-medium mb-1">Inscriptions</div>
          <div className="text-2xl font-bold">{partner.attributions.length}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium mb-1">Abonnés payants</div>
          <div className="text-2xl font-bold">
            {partner.attributions.filter((a) => a.garage.subscriptionStatus === "ACTIVE").length}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium mb-1">Commission totale</div>
          <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium mb-1">À verser</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(commissionDue)}</div>
        </Card>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted2 hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content: Settings */}
      {activeTab === "settings" && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Paramètres du partenaire</h3>
          <p className="text-sm text-muted2 mb-4">Modifier les informations et les commissions</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nom"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Select label="Type" value={editType} onChange={setEditType}>
              {PARTNER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Input
              label="Commission (%)"
              type="number"
              min={0}
              max={100}
              value={editCommission}
              onChange={(e) => setEditCommission(Number(e.target.value))}
            />
            <Input
              label="Coupon Stripe"
              value={editCouponId}
              onChange={(e) => setEditCouponId(e.target.value)}
              placeholder="PROMO20"
            />
            <div className="flex items-center pt-6">
              <Toggle
                checked={editActive}
                onChange={setEditActive}
                label="Partenariat actif"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Content: Attributions */}
      {activeTab === "attributions" && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Garages attribués</h3>
          <p className="text-sm text-muted2 mb-4">Liste des inscriptions via ce partenaire</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Garage</th>
                  <th className="text-left py-3 px-2 font-medium">Ville</th>
                  <th className="text-left py-3 px-2 font-medium">Plan</th>
                  <th className="text-left py-3 px-2 font-medium">Statut</th>
                  <th className="text-left py-3 px-2 font-medium">Date inscription</th>
                </tr>
              </thead>
              <tbody>
                {partner.attributions.map((attr) => (
                  <tr key={attr.id} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium">{attr.garage.name}</td>
                    <td className="py-3 px-2">{attr.garage.city || "-"}</td>
                    <td className="py-3 px-2">
                      <Badge variant="accent">{attr.garage.plan}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={attr.garage.subscriptionStatus === "ACTIVE" ? "success" : "neutral"}>
                        {attr.garage.subscriptionStatus || "TRIAL"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">{formatDate(attr.garage.createdAt)}</td>
                  </tr>
                ))}
                {partner.attributions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted2">
                      Aucune attribution
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Commissions */}
      {activeTab === "commissions" && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Lignes de commission</h3>
          <p className="text-sm text-muted2 mb-4">Commissions générées par les paiements</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Date</th>
                  <th className="text-left py-3 px-2 font-medium">Invoice Stripe</th>
                  <th className="text-right py-3 px-2 font-medium">Montant facture</th>
                  <th className="text-right py-3 px-2 font-medium">Taux</th>
                  <th className="text-right py-3 px-2 font-medium">Commission</th>
                  <th className="text-center py-3 px-2 font-medium">Valide</th>
                </tr>
              </thead>
              <tbody>
                {partner.commissionLines.map((line) => (
                  <tr key={line.id} className="border-b border-border/50">
                    <td className="py-3 px-2">{formatDate(line.createdAt)}</td>
                    <td className="py-3 px-2">
                      <code className="text-xs">{line.stripeInvoiceId.slice(0, 20)}...</code>
                    </td>
                    <td className="py-3 px-2 text-right">{formatCurrency(line.invoiceAmountCents)}</td>
                    <td className="py-3 px-2 text-right">{line.commissionPercent}%</td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(line.commissionCents)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {line.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <Badge variant="warning">Invalidée</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {partner.commissionLines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted2">
                      Aucune commission
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Payouts */}
      {activeTab === "payouts" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Paiements</h3>
              <p className="text-sm text-muted2">Historique des versements</p>
            </div>
            <Button size="sm" onClick={() => setPayoutOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          </div>

          <Dialog
            open={payoutOpen}
            title="Créer un paiement"
            description={`Commission due: ${formatCurrency(commissionDue)}`}
            confirmLabel={creatingPayout ? "Création..." : "Créer"}
            onConfirm={handleCreatePayout}
            onOpenChange={setPayoutOpen}
          >
            <div className="grid gap-4 py-4">
              <Input
                label="Période début"
                type="date"
                value={payoutStart}
                onChange={(e) => setPayoutStart(e.target.value)}
              />
              <Input
                label="Période fin"
                type="date"
                value={payoutEnd}
                onChange={(e) => setPayoutEnd(e.target.value)}
              />
              <Input
                label="Montant (€)"
                type="number"
                min={0}
                step={0.01}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
              />
            </div>
          </Dialog>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Période</th>
                  <th className="text-right py-3 px-2 font-medium">Montant</th>
                  <th className="text-left py-3 px-2 font-medium">Statut</th>
                  <th className="text-left py-3 px-2 font-medium">Date paiement</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {partner.payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(payout.amountCents)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={payout.status === "PAID" ? "success" : "neutral"}>
                        {payout.status === "PAID" ? "Payé" : payout.status === "CANCELLED" ? "Annulé" : "À payer"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">{payout.paidAt ? formatDate(payout.paidAt) : "-"}</td>
                    <td className="py-3 px-2">
                      {payout.status === "DUE" && (
                        <Button variant="secondary" size="sm" onClick={() => handleMarkPaid(payout.id)}>
                          Marquer payé
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {partner.payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted2">
                      Aucun paiement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
