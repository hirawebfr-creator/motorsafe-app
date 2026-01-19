"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  RefreshCw,
  Loader2,
  Plus,
  Sparkles,
  Bug,
  Shield,
  Scale,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { fetcher, requestJson } from "@/lib/fetcher";
import { useToast } from "@/components/ui/Toast";

// ============================================
// Types
// ============================================

type ChangelogType = "FEATURE" | "FIX" | "SECURITY" | "LEGAL";

interface ChangelogEntry {
  id: string;
  title: string;
  bodyMarkdown: string;
  type: ChangelogType;
  version: string | null;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
}

// ============================================
// Constants
// ============================================

const TYPE_CONFIG: Record<ChangelogType, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  FEATURE: {
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <Sparkles size={14} />,
    label: "Nouveauté",
  },
  FIX: {
    color: "text-orange-600",
    bg: "bg-orange-100",
    icon: <Bug size={14} />,
    label: "Correction",
  },
  SECURITY: {
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <Shield size={14} />,
    label: "Sécurité",
  },
  LEGAL: {
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: <Scale size={14} />,
    label: "Légal",
  },
};

const TYPE_OPTIONS: { value: ChangelogType; label: string }[] = [
  { value: "FEATURE", label: "Nouveauté" },
  { value: "FIX", label: "Correction" },
  { value: "SECURITY", label: "Sécurité" },
  { value: "LEGAL", label: "Légal" },
];

// ============================================
// Component
// ============================================

export default function AdminChangelogPage() {
  const { push: toast } = useToast();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formType, setFormType] = useState<ChangelogType>("FEATURE");
  const [formVersion, setFormVersion] = useState("");
  const [formPublished, setFormPublished] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher<{ entries: ChangelogEntry[] }>("/api/admin/changelog");
      setEntries(res.entries);
    } catch (err) {
      console.error("Failed to load entries:", err);
      toast({ title: "Erreur de chargement", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const resetForm = () => {
    setFormTitle("");
    setFormBody("");
    setFormType("FEATURE");
    setFormVersion("");
    setFormPublished(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setFormTitle(entry.title);
    setFormBody(entry.bodyMarkdown);
    setFormType(entry.type);
    setFormVersion(entry.version || "");
    setFormPublished(entry.isPublished);
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    try {
      setSaving(true);

      if (editingId) {
        // Update
        await requestJson(`/api/admin/changelog/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: formTitle,
            bodyMarkdown: formBody,
            type: formType,
            version: formVersion || null,
            isPublished: formPublished,
          }),
        });
        toast({ title: "Entrée mise à jour", variant: "success" });
      } else {
        // Create
        await requestJson("/api/admin/changelog", {
          method: "POST",
          body: JSON.stringify({
            title: formTitle,
            bodyMarkdown: formBody,
            type: formType,
            version: formVersion || null,
            isPublished: formPublished,
          }),
        });
        toast({ title: "Entrée créée", variant: "success" });
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      console.error("Failed to save:", err);
      toast({ title: "Erreur lors de la sauvegarde", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (entry: ChangelogEntry) => {
    try {
      await requestJson(`/api/admin/changelog/${entry.id}/publish`, {
        method: "POST",
      });
      toast({ title: entry.isPublished ? "Dépublié" : "Publié", variant: "success" });
      await loadEntries();
    } catch (err) {
      console.error("Failed to toggle publish:", err);
      toast({ title: "Erreur", variant: "error" });
    }
  };

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="ms-animate-slide-up">
      {/* Header */}
      <div className="ms-page-header">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-[var(--ms-primary)]" />
          <div>
            <h1 className="ms-page-title">Changelog</h1>
            <p className="ms-page-subtitle">Gérer les nouveautés visibles aux garages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadEntries()}
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
            Nouvelle entrée
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="ms-card mb-6">
          <div className="ms-card-header">
            <h2 className="ms-card-title">
              {editingId ? "Modifier l'entrée" : "Nouvelle entrée"}
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
                  placeholder="Ex: Signature client mobile"
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="ms-label">Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ChangelogType)}
                    className="ms-input"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="ms-label">Version</label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    className="ms-input"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="ms-label">Contenu (Markdown) *</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="ms-input min-h-[200px] font-mono text-sm"
                placeholder="## Description&#10;&#10;Détaillez la nouveauté ici...&#10;&#10;- Point 1&#10;- Point 2"
                required
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formPublished}
                onChange={(e) => setFormPublished(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="published" className="text-sm">
                Publier immédiatement
              </label>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !formTitle.trim() || !formBody.trim()}
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

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="ms-card">
          <div className="ms-card-body text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-[var(--ms-text-muted)] opacity-30" />
            <p className="text-[var(--ms-text-muted)]">Aucune entrée dans le changelog</p>
          </div>
        </div>
      ) : (
        <div className="ms-card">
          <div className="overflow-x-auto">
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Version</th>
                  <th>Publié</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const cfg = TYPE_CONFIG[entry.type];
                  return (
                    <tr key={entry.id}>
                      <td>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="font-medium">{entry.title}</td>
                      <td className="text-[var(--ms-text-muted)]">
                        {entry.version || "—"}
                      </td>
                      <td>
                        {entry.isPublished ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye size={14} /> Oui
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[var(--ms-text-muted)]">
                            <EyeOff size={14} /> Non
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-[var(--ms-text-muted)]">
                        {formatDate(entry.publishedAt)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="ms-btn ms-btn-secondary ms-btn-sm"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleTogglePublish(entry)}
                            className="ms-btn ms-btn-secondary ms-btn-sm"
                            title={entry.isPublished ? "Dépublier" : "Publier"}
                          >
                            {entry.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
