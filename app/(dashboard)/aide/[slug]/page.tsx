"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Book,
  Clock,
  Tag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";

// ============================================
// Types
// ============================================

type Article = {
  id: number;
  title: string;
  slug: string;
  bodyMarkdown: string;
  tags: string[];
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Simple Markdown Renderer (Safe)
// ============================================

function renderMarkdown(md: string): string {
  // Basic markdown rendering (safe - no HTML injection)
  let html = md
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-[var(--ms-text)]">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3 text-[var(--ms-text)]">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-[var(--ms-text)]">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-[var(--ms-bg)] rounded-lg p-4 my-4 overflow-x-auto text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[var(--ms-bg)] px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    // Links (only internal)
    .replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '<a href="/$2" class="text-[var(--ms-primary)] hover:underline">$1</a>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-4 text-[var(--ms-text)]">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  // Wrap in paragraph
  html = `<p class="mb-4 text-[var(--ms-text)]">${html}</p>`;
  
  // Fix list items (wrap in ul)
  html = html.replace(/(<li[^>]*>.*?<\/li>)+/g, '<ul class="list-disc mb-4 pl-4">$&</ul>');

  return html;
}

// ============================================
// Component
// ============================================

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetcher<Article>(`/api/kb/articles/${slug}`);
      setArticle(res);
    } catch (err: unknown) {
      toast.error("Erreur de chargement de l'article");
      setError("Article non trouvé");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[var(--ms-primary)]" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="ms-animate-slide-up">
        <Link
          href="/aide"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
        >
          <ArrowLeft size={16} />
          Retour au centre d&apos;aide
        </Link>

        <div className="ms-card">
          <div className="ms-card-body py-12 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium text-[var(--ms-text)]">Article non trouvé</p>
            <p className="mt-2 text-[var(--ms-text-muted)]">
              Cet article n&apos;existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-animate-slide-up">
      {/* Back link */}
      <Link
        href="/aide"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--ms-text-muted)] hover:text-[var(--ms-text)]"
      >
        <ArrowLeft size={16} />
        Retour au centre d&apos;aide
      </Link>

      <div className="mx-auto max-w-3xl">
        {/* Article Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--ms-text-muted)]">
            <Book size={14} />
            <Link href={`/aide?category=${article.categorySlug}`} className="hover:underline">
              {article.categoryName}
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[var(--ms-text)]">{article.title}</h1>
          <div className="mt-3 flex items-center gap-4 text-sm text-[var(--ms-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              Mis à jour le {new Date(article.updatedAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--ms-bg)] px-3 py-1 text-sm text-[var(--ms-text-muted)]"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="ms-card">
          <div className="ms-card-body prose prose-lg max-w-none">
            <div
              className="kb-article-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.bodyMarkdown) }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--ms-text-muted)]">
            Cet article ne répond pas à votre question ?
          </p>
          <Link
            href="/support"
            className="mt-2 inline-flex items-center gap-2 text-[var(--ms-primary)] hover:underline"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
