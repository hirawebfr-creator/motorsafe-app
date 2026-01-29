"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Bug,
  Shield,
  Scale,
  Calendar,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

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
  publishedAt: string;
}

// ============================================
// Constants
// ============================================

const TYPE_CONFIG: Record<ChangelogType, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  FEATURE: {
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <Sparkles size={16} />,
    label: "Nouveauté",
  },
  FIX: {
    color: "text-orange-600",
    bg: "bg-orange-100",
    icon: <Bug size={16} />,
    label: "Correction",
  },
  SECURITY: {
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <Shield size={16} />,
    label: "Sécurité",
  },
  LEGAL: {
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: <Scale size={16} />,
    label: "Légal",
  },
};

// ============================================
// Simple Markdown Renderer (safe, no HTML injection)
// ============================================

function renderMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-[var(--ms-text)]">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-[var(--ms-text)]">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-[var(--ms-text)]">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-[var(--ms-text)]">
          {line.slice(2)}
        </h1>
      );
    }
    // List items
    else if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
    }
    // Empty line
    else if (line.trim() === "") {
      flushList();
    }
    // Regular paragraph
    else {
      flushList();
      // Simple inline formatting
      let text = line;
      // Bold: **text**
      text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      // Italic: *text*
      text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      // Code: `text`
      text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
      
      elements.push(
        <p 
          key={i} 
          className="my-2 text-[var(--ms-text)]"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
  }
  
  flushList();
  return elements;
}

// ============================================
// Component
// ============================================

export default function ChangelogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcher<{ entry: ChangelogEntry }>(`/api/changelog/${id}`);
      setEntry(res.entry);
    } catch (err) {
      console.error("Failed to load entry:", err);
      setError("Impossible de charger cette entrée");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  const formatDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Date inconnue";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="ms-animate-slide-up">
        <Link
          href="/nouveautes"
          className="ms-btn ms-btn-secondary mb-6"
        >
          <ArrowLeft size={16} />
          Retour aux nouveautés
        </Link>
        <div className="ms-card">
          <div className="ms-card-body text-center py-12">
            <p className="text-[var(--ms-text-muted)]">{error || "Entrée non trouvée"}</p>
          </div>
        </div>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[entry.type];

  return (
    <div className="ms-animate-slide-up max-w-3xl">
      {/* Back button */}
      <Link
        href="/nouveautes"
        className="ms-btn ms-btn-secondary mb-6"
      >
        <ArrowLeft size={16} />
        Retour aux nouveautés
      </Link>

      {/* Entry Card */}
      <article className="ms-card">
        <div className="ms-card-body">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            {entry.version && (
              <span className="text-sm text-[var(--ms-text-muted)]">
                Version {entry.version}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[var(--ms-text)] mb-2">
            {entry.title}
          </h1>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-[var(--ms-text-muted)] mb-6">
            <Calendar size={14} />
            {formatDate(entry.publishedAt)}
          </div>

          {/* Divider */}
          <hr className="border-[var(--ms-border)] mb-6" />

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(entry.bodyMarkdown)}
          </div>
        </div>
      </article>
    </div>
  );
}
