"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { ConfirmDialog as Dialog } from "@/components/ui/ConfirmDialog";
import {
  Users,
  Plus,
  Copy,
  ExternalLink,
  Euro,
  TrendingUp,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface PartnerStats {
  signups: number;
  paid: number;
  commissionTotal: number;
  commissionPaid: number;
  commissionDue: number;
}

interface Partner {
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
  stats: PartnerStats;
}

const PARTNER_TYPES = [
  { value: "GARAGE", label: "Garage partenaire" },
  { value: "INFLUENCER", label: "Influenceur" },
  { value: "AGENCY", label: "Agence" },
  { value: "OTHER", label: "Autre" },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("OTHER");
  const [formCommission, setFormCommission] = useState(20);
  const [formCouponId, setFormCouponId] = useState("");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/partners");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPartners(data.partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async () => {
    if (!formName || !formEmail) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          type: formType,
          commissionPercent: formCommission,
          stripeCouponId: formCouponId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur création");
        return;
      }

      // Reset form and refresh
      setFormName("");
      setFormEmail("");
      setFormType("OTHER");
      setFormCommission(20);
      setFormCouponId("");
      setCreateOpen(false);
      fetchPartners();
    } catch (error) {
      console.error("Error creating partner:", error);
      alert("Erreur création partenaire");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !partner.isActive }),
      });

      if (!res.ok) throw new Error("Erreur mise à jour");
      fetchPartners();
    } catch (error) {
      console.error("Error toggling partner:", error);
    }
  };

  const copyRefLink = (refCode: string) => {
    const link = `${window.location.origin}/pro/inscription?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopied(refCode);
    setTimeout(() => setCopied(null), 2000);
  };

  // Summary stats
  const totalSignups = partners.reduce((sum, p) => sum + p.stats.signups, 0);
  const totalPaid = partners.reduce((sum, p) => sum + p.stats.paid, 0);
  const totalCommissionDue = partners.reduce((sum, p) => sum + p.stats.commissionDue, 0);
  const activePartners = partners.filter((p) => p.isActive).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Partenaires</h1>
          <p className="text-muted2">Gestion du programme d&apos;affiliation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchPartners} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau partenaire
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        title="Créer un partenaire"
        description="Un code affilié unique sera généré automatiquement."
        confirmLabel={creating ? "Création..." : "Créer"}
        onConfirm={handleCreatePartner}
        onOpenChange={setCreateOpen}
      >
        <div className="grid gap-4 py-4">
          <Input
            label="Nom"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Garage Martin"
          />
          <Input
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="contact@example.com"
          />
          <Select label="Type" value={formType} onChange={(e) => setFormType(e.target.value)}>
            {PARTNER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Input
            label="Commission (%)"
            type="number"
            min={0}
            max={100}
            value={formCommission}
            onChange={(e) => setFormCommission(Number(e.target.value))}
          />
          <Input
            label="Coupon Stripe (optionnel)"
            value={formCouponId}
            onChange={(e) => setFormCouponId(e.target.value)}
            placeholder="PROMO20"
          />
        </div>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium">Partenaires actifs</span>
            <Users className="h-4 w-4 text-muted2" />
          </div>
          <div className="text-2xl font-bold">{activePartners}</div>
          <p className="text-xs text-muted2">sur {partners.length} total</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium">Inscriptions</span>
            <TrendingUp className="h-4 w-4 text-muted2" />
          </div>
          <div className="text-2xl font-bold">{totalSignups}</div>
          <p className="text-xs text-muted2">via liens affiliés</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium">Conversions</span>
            <CheckCircle className="h-4 w-4 text-muted2" />
          </div>
          <div className="text-2xl font-bold">{totalPaid}</div>
          <p className="text-xs text-muted2">abonnements payants</p>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium">Commissions dues</span>
            <Euro className="h-4 w-4 text-muted2" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCommissionDue)}</div>
          <p className="text-xs text-muted2">à verser</p>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <div className="pb-4">
          <h2 className="text-lg font-semibold">Liste des partenaires</h2>
          <p className="text-sm text-muted2">Cliquez sur un partenaire pour voir les détails</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium">Partenaire</th>
                <th className="text-left py-3 px-2 font-medium">Type</th>
                <th className="text-left py-3 px-2 font-medium">Code affilié</th>
                <th className="text-right py-3 px-2 font-medium">Commission</th>
                <th className="text-right py-3 px-2 font-medium">Inscrits</th>
                <th className="text-right py-3 px-2 font-medium">Payants</th>
                <th className="text-right py-3 px-2 font-medium">Due</th>
                <th className="text-center py-3 px-2 font-medium">Actif</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-border/50 hover:bg-surface2/50">
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-xs text-muted2">{partner.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="accent">
                      {PARTNER_TYPES.find((t) => t.value === partner.type)?.label || partner.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-surface2 px-2 py-1 rounded">{partner.refCode}</code>
                      <button
                        className="p-1 hover:bg-surface2 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyRefLink(partner.refCode);
                        }}
                      >
                        {copied === partner.refCode ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">{partner.commissionPercent}%</td>
                  <td className="py-3 px-2 text-right">{partner.stats.signups}</td>
                  <td className="py-3 px-2 text-right">{partner.stats.paid}</td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(partner.stats.commissionDue)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Toggle
                      checked={partner.isActive}
                      onChange={() => handleToggleActive(partner)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <button
                      className="p-2 hover:bg-surface2 rounded"
                      onClick={() => router.push(`/admin/partners/${partner.id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted2">
                    Aucun partenaire. Créez le premier !
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                    Chargement...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
