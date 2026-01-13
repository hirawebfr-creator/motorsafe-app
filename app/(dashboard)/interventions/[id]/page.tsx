"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileText,
  Check,
  ClipboardCheck,
  Wrench,
  Car,
  HandshakeIcon,
  LogOut,
  Save,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";

// === Types ===
type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  client: { id: number; firstName: string; lastName: string };
};

type Document = {
  id: string;
  fileName: string;
  fileUrl: string;
  mime: string;
  createdAt: string;
};

type IntakeChecklist = {
  lights?: boolean;
  noises?: boolean;
  leaks?: boolean;
  smoke?: boolean;
  bodyDamage?: boolean;
};

type OuttakeChecklist = {
  roadTest?: boolean;
  lightsOff?: boolean;
  clean?: boolean;
  clientBriefed?: boolean;
};

type Intervention = {
  id: string;
  type: string;
  status: "DRAFT" | "OPEN" | "DONE" | "CANCELED";
  createdAt: string;
  performedAt?: string | null;
  notes?: string | null;
  odometerKm?: number | null;
  ecuType?: string | null;
  softwareVersion?: string | null;
  checksum?: string | null;
  amountCents?: number | null;
  vehicle: Vehicle;
  documents?: Document[];
  revisions?: Array<{ id?: string; createdAt?: string; hash?: string | null }>;
  tags?: string[];
  intakeChecklist?: IntakeChecklist | null;
  intakeNotes?: string | null;
  agreementAt?: string | null;
  agreementMethod?: string | null;
  workNotes?: string | null;
  partsNotes?: string | null;
  outtakeChecklist?: OuttakeChecklist | null;
  closedAt?: string | null;
};

const TAG_OPTIONS = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "REPAIR_GENERAL", label: "Réparation" },
  { value: "E85_BOITIER", label: "E85 Boîtier" },
  { value: "E85_CARTO", label: "E85 Carto" },
  { value: "REPROG_ECU", label: "Reprog ECU" },
  { value: "REPROG_PERF", label: "Reprog Perf" },
  { value: "OTHER_MODIF", label: "Autre modif" },
];

const INTAKE_ITEMS: { key: keyof IntakeChecklist; label: string }[] = [
  { key: "lights", label: "Voyants allumés" },
  { key: "noises", label: "Bruits anormaux" },
  { key: "leaks", label: "Fuites détectées" },
  { key: "smoke", label: "Fumée visible" },
  { key: "bodyDamage", label: "Dégâts carrosserie" },
];

const OUTTAKE_ITEMS: { key: keyof OuttakeChecklist; label: string }[] = [
  { key: "roadTest", label: "Essai routier effectué" },
  { key: "lightsOff", label: "Tous voyants éteints" },
  { key: "clean", label: "Véhicule propre" },
  { key: "clientBriefed", label: "Client informé" },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "var(--ms-bg-subtle)", text: "var(--ms-text-secondary)", label: "Brouillon" },
  OPEN: { bg: "var(--ms-primary-light)", text: "var(--ms-primary)", label: "En cours" },
  DONE: { bg: "var(--ms-success-light)", text: "var(--ms-success)", label: "Terminée" },
  CANCELED: { bg: "var(--ms-error-light)", text: "var(--ms-error)", label: "Annulée" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatCents(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function InterventionDetailPage() {
  const { id } = useParams();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [intakeKm, setIntakeKm] = useState<string>("");
  const [intakeNotes, setIntakeNotes] = useState<string>("");
  const [intakeChecklist, setIntakeChecklist] = useState<IntakeChecklist>({});
  const [tags, setTags] = useState<string[]>([]);
  const [amountCents, setAmountCents] = useState<string>("");
  const [workNotes, setWorkNotes] = useState<string>("");
  const [partsNotes, setPartsNotes] = useState<string>("");
  const [outtakeChecklist, setOuttakeChecklist] = useState<OuttakeChecklist>({});

  const fetchIntervention = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/interventions/${id}`);
      if (!res.ok) throw new Error("Erreur lors du chargement.");
      const data = await res.json();
      const int = data?.data ?? null;
      setIntervention(int);
      if (int) {
        setIntakeKm(int.odometerKm?.toString() ?? "");
        setIntakeNotes(int.intakeNotes ?? int.notes ?? "");
        setIntakeChecklist(int.intakeChecklist ?? {});
        setTags(int.tags ?? []);
        setAmountCents(int.amountCents ? (int.amountCents / 100).toFixed(2) : "");
        setWorkNotes(int.workNotes ?? "");
        setPartsNotes(int.partsNotes ?? "");
        setOuttakeChecklist(int.outtakeChecklist ?? {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchIntervention(); }, [id, fetchIntervention]);

  const saveSection = async (section: string, data: Record<string, unknown>) => {
    setSaving(section);
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Erreur de sauvegarde");
      }
      await fetchIntervention();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  };

  const saveIntake = () => saveSection("intake", { odometerKm: intakeKm ? parseInt(intakeKm, 10) : null, intakeNotes, intakeChecklist, notes: intakeNotes });
  const saveTags = () => saveSection("tags", { tags });
  const saveAgreement = () => saveSection("agreement", { amountCents: amountCents ? Math.round(parseFloat(amountCents) * 100) : null, agreementAt: new Date().toISOString(), agreementMethod: "in_app" });
  const saveWork = () => saveSection("work", { workNotes, partsNotes });
  const closeIntervention = () => { if (confirm("Clôturer cette intervention ?")) saveSection("close", { outtakeChecklist, closedAt: new Date().toISOString(), status: "DONE" }); };

  const toggleTag = (tag: string) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const toggleIntakeItem = (key: keyof IntakeChecklist) => setIntakeChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleOuttakeItem = (key: keyof OuttakeChecklist) => setOuttakeChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const isClosed = intervention?.status === "DONE" || intervention?.closedAt;

  if (loading) return <div className="flex justify-center py-12"><Loading /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!intervention) return <EmptyState title="Intervention introuvable" description="Ce dossier n'existe pas." />;

  const statusConfig = STATUS_CONFIG[intervention.status] ?? STATUS_CONFIG.OPEN;

  return (
    <div className="grid gap-6 ms-animate-slide-up">
      <SectionHeader
        title={`Dossier ${intervention.vehicle.plate}`}
        description="Parcours complet : réception → travaux → restitution"
        level={1}
        action={
          <div className="flex gap-2">
            <Link href="/interventions"><Button variant="secondary" size="sm">Retour</Button></Link>
            <a href={`/api/interventions/${intervention.id}/pdf`} target="_blank" rel="noreferrer">
              <Button size="sm"><FileText size={16} className="mr-1" />Dossier PDF</Button>
            </a>
          </div>
        }
      />

      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <Badge style={{ background: statusConfig.bg, color: statusConfig.text }}>{statusConfig.label}</Badge>
        <Badge variant="neutral">{intervention.type}</Badge>
        <Badge variant="neutral">{intervention.vehicle.brand} {intervention.vehicle.model}</Badge>
        <Badge variant="neutral">Client: {intervention.vehicle.client.firstName} {intervention.vehicle.client.lastName}</Badge>
        {intervention.agreementAt && <Badge variant="accent"><CheckCircle2 size={12} className="mr-1" />Accord validé</Badge>}
        {isClosed && <Badge style={{ background: "var(--ms-success-light)", color: "var(--ms-success)" }}><Check size={12} className="mr-1" />Clôturée</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Réception */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]"><Car size={20} className="text-[var(--ms-primary)]" /></div>
            <div><h3 className="text-lg font-semibold">1. Réception</h3><p className="text-xs text-muted2">Preuves d&apos;entrée</p></div>
          </div>
          <div className="ms-cardBody space-y-4">
            <div><label className="block text-sm font-medium mb-1">Kilométrage</label><input type="number" value={intakeKm} onChange={(e) => setIntakeKm(e.target.value)} className="ms-input w-full" placeholder="125000" disabled={!!isClosed} /></div>
            <div><label className="block text-sm font-medium mb-1">Symptômes client</label><textarea value={intakeNotes} onChange={(e) => setIntakeNotes(e.target.value)} className="ms-input w-full min-h-[80px]" placeholder="Symptômes..." disabled={!!isClosed} /></div>
            <div>
              <label className="block text-sm font-medium mb-2">Checklist</label>
              <div className="grid grid-cols-2 gap-2">
                {INTAKE_ITEMS.map((item) => (
                  <button key={item.key} type="button" onClick={() => toggleIntakeItem(item.key)} disabled={!!isClosed}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${intakeChecklist[item.key] ? "bg-[var(--ms-warning-light)] border-[var(--ms-warning)] text-[#B45309]" : "bg-[var(--ms-bg-subtle)] border-transparent text-muted2"}`}>
                    {intakeChecklist[item.key] ? <AlertTriangle size={14} /> : <Check size={14} />}{item.label}
                  </button>
                ))}
              </div>
            </div>
            {intervention.documents && intervention.documents.length > 0 && (
              <div><label className="block text-sm font-medium mb-2">Documents</label>
                {intervention.documents.map((doc) => (<a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[var(--ms-primary)] hover:underline"><Camera size={14} />{doc.fileName}</a>))}
              </div>
            )}
            <Button onClick={saveIntake} disabled={saving === "intake" || !!isClosed} className="w-full" variant="secondary">
              {saving === "intake" ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}Enregistrer
            </Button>
          </div>
        </Card>

        {/* Section 2: Types */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-accent-light)]"><ClipboardCheck size={20} className="text-[var(--ms-accent)]" /></div>
            <div><h3 className="text-lg font-semibold">2. Type d&apos;intervention</h3><p className="text-xs text-muted2">Catégorisation</p></div>
          </div>
          <div className="ms-cardBody space-y-4">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => toggleTag(opt.value)} disabled={!!isClosed}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border ${tags.includes(opt.value) ? "bg-[var(--ms-primary)] text-white border-[var(--ms-primary)]" : "bg-[var(--ms-bg-subtle)] text-muted2 border-transparent hover:border-[var(--ms-primary)]"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {tags.length > 0 && <p className="text-xs text-muted2">{tags.length} type(s)</p>}
            <Button onClick={saveTags} disabled={saving === "tags" || !!isClosed} className="w-full" variant="secondary">
              {saving === "tags" ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}Enregistrer
            </Button>
          </div>
        </Card>

        {/* Section 3: Accord */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-success-light)]"><HandshakeIcon size={20} className="text-[var(--ms-success)]" /></div>
            <div><h3 className="text-lg font-semibold">3. Accord client</h3><p className="text-xs text-muted2">Validation horodatée</p></div>
          </div>
          <div className="ms-cardBody space-y-4">
            <div><label className="block text-sm font-medium mb-1">Montant estimé (€)</label><input type="number" step="0.01" value={amountCents} onChange={(e) => setAmountCents(e.target.value)} className="ms-input w-full" placeholder="350.00" disabled={!!intervention.agreementAt || !!isClosed} /></div>
            {intervention.agreementAt ? (
              <div className="rounded-lg bg-[var(--ms-success-light)] p-4 text-center">
                <CheckCircle2 size={32} className="mx-auto text-[var(--ms-success)] mb-2" />
                <p className="font-semibold text-[var(--ms-success)]">Accord validé</p>
                <p className="text-xs text-muted2 mt-1">Le {formatDate(intervention.agreementAt)}</p>
                {intervention.amountCents && <p className="mt-2 text-lg font-bold text-[var(--ms-success)]">{formatCents(intervention.amountCents)}</p>}
              </div>
            ) : (
              <Button onClick={saveAgreement} disabled={saving === "agreement" || !!isClosed} className="w-full">
                {saving === "agreement" ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}Valider accord
              </Button>
            )}
          </div>
        </Card>

        {/* Section 4: Travaux */}
        <Card className="p-0 overflow-hidden">
          <div className="ms-cardHeader flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-warning-light)]"><Wrench size={20} className="text-[#B45309]" /></div>
            <div><h3 className="text-lg font-semibold">4. Travaux effectués</h3><p className="text-xs text-muted2">Détail des interventions</p></div>
          </div>
          <div className="ms-cardBody space-y-4">
            <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} className="ms-input w-full min-h-[100px]" placeholder="Travaux réalisés..." disabled={!!isClosed} /></div>
            <div><label className="block text-sm font-medium mb-1">Pièces / références</label><textarea value={partsNotes} onChange={(e) => setPartsNotes(e.target.value)} className="ms-input w-full min-h-[60px]" placeholder="Pièces..." disabled={!!isClosed} /></div>
            {(intervention.ecuType || intervention.softwareVersion || intervention.checksum) && (
              <div className="rounded-lg bg-[var(--ms-bg-subtle)] p-3 text-sm">
                <p className="font-medium mb-1">Données techniques</p>
                {intervention.ecuType && <p>ECU: {intervention.ecuType}</p>}
                {intervention.softwareVersion && <p>Version: {intervention.softwareVersion}</p>}
                {intervention.checksum && <p className="font-mono text-xs">Checksum: {intervention.checksum}</p>}
              </div>
            )}
            <Button onClick={saveWork} disabled={saving === "work" || !!isClosed} className="w-full" variant="secondary">
              {saving === "work" ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />}Enregistrer
            </Button>
          </div>
        </Card>

        {/* Section 5: Sortie */}
        <Card className="p-0 overflow-hidden lg:col-span-2">
          <div className="ms-cardHeader flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ms-error-light)]"><LogOut size={20} className="text-[var(--ms-error)]" /></div>
            <div><h3 className="text-lg font-semibold">5. Sortie / Restitution</h3><p className="text-xs text-muted2">Contrôle final</p></div>
          </div>
          <div className="ms-cardBody">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Checklist sortie</label>
                <div className="space-y-2">
                  {OUTTAKE_ITEMS.map((item) => (
                    <button key={item.key} type="button" onClick={() => toggleOuttakeItem(item.key)} disabled={!!isClosed}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm border ${outtakeChecklist[item.key] ? "bg-[var(--ms-success-light)] border-[var(--ms-success)] text-[var(--ms-success)]" : "bg-[var(--ms-bg-subtle)] border-transparent text-muted2"}`}>
                      {outtakeChecklist[item.key] ? <CheckCircle2 size={18} /> : <Clock size={18} />}{item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                {isClosed ? (
                  <div className="rounded-xl bg-[var(--ms-success-light)] p-6 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-[var(--ms-success)] mb-3" />
                    <p className="text-xl font-bold text-[var(--ms-success)]">Intervention clôturée</p>
                    <p className="text-sm text-muted2 mt-1">Le {formatDate(intervention.closedAt)}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[var(--ms-border)] p-6 text-center">
                    <LogOut size={32} className="mx-auto text-muted2 mb-3" />
                    <p className="font-medium mb-2">Prêt à clôturer ?</p>
                    <p className="text-sm text-muted2 mb-4">Véhicule restitué au client.</p>
                    <Button onClick={closeIntervention} disabled={saving === "close"} className="w-full">
                      {saving === "close" ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}Clôturer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {intervention.revisions && intervention.revisions.length > 0 && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-3">Historique des révisions</h3>
          <div className="space-y-2">
            {intervention.revisions.slice(0, 5).map((rev, idx) => (
              <div key={rev.id || idx} className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-[var(--ms-primary)]" />
                <span className="font-medium">Révision {intervention.revisions!.length - idx}</span>
                <span className="text-muted2">—</span>
                <span className="text-muted2">{formatDate(rev.createdAt)}</span>
                {rev.hash && <span className="font-mono text-xs text-muted2 truncate max-w-[200px]">{rev.hash.substring(0, 16)}...</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
