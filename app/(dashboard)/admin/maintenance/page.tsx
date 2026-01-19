"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wrench,
  RefreshCw,
  Loader2,
  Plus,
  Calendar,
  Clock,
  Pencil,
  Power,
  Check,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

// ============================================
// Types
// ============================================

type MaintenanceSeverity = "INFO" | "WARNING";

interface MaintenanceWindow {
  id: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  severity: MaintenanceSeverity;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
}

// ============================================
// Component
// ============================================

export default function AdminMaintenancePage() {
  const { push: toast } = useToast();
  const [maintenances, setMaintenances] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formSeverity, setFormSeverity] = useState<MaintenanceSeverity>("INFO");
  const [formActive, setFormActive] = useState(true);

  const loadMaintenances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ maintenances: MaintenanceWindow[] }>("/api/admin/maintenance");
      setMaintenances(res.maintenances);
    } catch (err) {
      console.error("Failed to load maintenances:", err);
      toast({ title: "Erreur de chargement", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMaintenances();
  }, [loadMaintenances]);

  const resetForm = () => {
    setFormTitle("");
    setFormMessage("");
    setFormStartsAt("");
    setFormEndsAt("");
    setFormSeverity("INFO");
    setFormActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (m: MaintenanceWindow) => {
    setFormTitle(m.title);
    setFormMessage(m.message);
    // Format dates for datetime-local input
    setFormStartsAt(new Date(m.startsAt).toISOString().slice(0, 16));
    setFormEndsAt(new Date(m.endsAt).toISOString().slice(0, 16));
    setFormSeverity(m.severity);
    setFormActive(m.isActive);
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim() || !formStartsAt || !formEndsAt) return;

    try {
      setSaving(true);

      if (editingId) {
        // Update
        await requestJson(`/api/admin/maintenance/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: formTitle,
            message: formMessage,
            startsAt: new Date(formStartsAt).toISOString(),
            endsAt: new Date(formEndsAt).toISOString(),
            severity: formSeverity,
            isActive: formActive,
          }),
        });
        toast({ title: "Maintenance mise à jour", variant: "success" });
      } else {
        // Create
        await requestJson("/api/admin/maintenance", {
          method: "POST",
          body: JSON.stringify({
            title: formTitle,
            message: formMessage,
            startsAt: new Date(formStartsAt).toISOString(),
            endsAt: new Date(formEndsAt).toISOString(),
            severity: formSeverity,
            isActive: formActive,
          }),
        });
        toast({ title: "Maintenance créée", variant: "success" });
      }

      resetForm();
      await loadMaintenances();
    } catch (err) {
      console.error("Failed to save:", err);
      toast({ title: "Erreur lors de la sauvegarde", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (m: MaintenanceWindow) => {
    try {
      await requestJson(`/api/admin/maintenance/${m.id}/deactivate`, {
        method: "POST",
      });
      toast({ title: "Maintenance désactivée", variant: "success" });
      await loadMaintenances();
    } catch (err) {
      console.error("Failed to deactivate:", err);
      toast({ title: "Erreur", variant: "error" });
    }
  };

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatus = (m: MaintenanceWindow): { label: string; color: string } => {
    const now = new Date();
    const start = new Date(m.startsAt);
    const end = new Date(m.endsAt);

    if (!m.isActive) return { label: "Désactivée", color: "text-gray-500" };
    if (now >= start && now <= end) return { label: "En cours", color: "text-orange-600" };
    if (now < start) return { label: "Planifiée", color: "text-blue-600" };
    return { label: "Terminée", color: "text-green-600" };
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div className="flex items-center gap-3">
          <Wrench size={28} className="text-[var(--ms-primary)]" />
          <div>
            <h1 className="ms-page-title">Maintenance</h1>
            <p className="ms-page-subtitle">Planifier les fenêtres de maintenance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMaintenances()}
            disabled={loading}
            className="ms-btn ms-btn-secondary"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="ms-btn ms-btn-primary"
          >
            <Plus size={16} />
            Nouvelle maintenance
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="ms-card mb-6">
          <div className="ms-card-header">
            <h2 className="ms-card-title">
              {editingId ? "Modifier la maintenance" : "Nouvelle maintenance"}
            </h2>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="ms-card-body pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="ms-label">Titre *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="ms-input"
                  placeholder="Ex: Mise à jour serveur"
                  required
                />
              </div>
              <div>
                <label className="ms-label">Sévérité *</label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value as MaintenanceSeverity)}
                  className="ms-input"
                >
                  <option value="INFO">Info (bleu)</option>
                  <option value="WARNING">Warning (orange)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="ms-label">Message *</label>
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="ms-input min-h-[100px]"
                placeholder="Description de la maintenance visible aux utilisateurs..."
                required
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="ms-label">Début *</label>
                <input
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  className="ms-input"
                  required
                />
              </div>
              <div>
                <label className="ms-label">Fin *</label>
                <input
                  type="datetime-local"
                  value={formEndsAt}
                  onChange={(e) => setFormEndsAt(e.target.value)}
                  className="ms-input"
                  required
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="active" className="text-sm">
                Active (visible aux utilisateurs)
              </label>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !formTitle.trim() || !formMessage.trim() || !formStartsAt || !formEndsAt}
                className="ms-btn ms-btn-primary"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editingId ? "Enregistrer" : "Créer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="ms-btn ms-btn-secondary"
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenances List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
        </div>
      ) : maintenances.length === 0 ? (
        <div className="ms-card">
          <div className="ms-card-body text-center py-12">
            <Wrench size={48} className="mx-auto mb-4 text-[var(--ms-text-muted)] opacity-30" />
            <p className="text-[var(--ms-text-muted)]">Aucune maintenance planifiée</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {maintenances.map((m) => {
            const status = getStatus(m);
            return (
              <div
                key={m.id}
                className={`ms-card ${!m.isActive ? "opacity-60" : ""}`}
              >
                <div className="ms-card-body">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {m.severity === "WARNING" ? (
                          <AlertTriangle size={18} className="text-orange-500" />
                        ) : (
                          <Info size={18} className="text-blue-500" />
                        )}
                        <h3 className="font-semibold text-[var(--ms-text)]">
                          {m.title}
                        </h3>
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--ms-text-muted)] mb-3">
                        {m.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--ms-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(m.startsAt)}
                        </span>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(m.endsAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(m)}
                        className="ms-btn ms-btn-secondary ms-btn-sm"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      {m.isActive && (
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(m)}
                          className="ms-btn ms-btn-secondary ms-btn-sm"
                          title="Désactiver"
                        >
                          <Power size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
