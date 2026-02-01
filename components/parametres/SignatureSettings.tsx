"use client";

/**
 * EVIDENCE-CAPTURE-01: Signature Settings Component
 *
 * Allows garage to upload their signature image (PNG only, max 500KB)
 * This signature will be pre-filled on delivery PVs
 */

import { useState, useCallback, useRef } from "react";
import { PenTool, Upload, Trash2, Loader2, CheckCircle, AlertCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignatureSettingsProps {
  garageId: number | null;
  currentSignatureKey: string | null;
  hasBrandingFeature: boolean;
  planName: string;
}

export function SignatureSettings({
  garageId,
  currentSignatureKey,
  hasBrandingFeature,
  planName,
}: SignatureSettingsProps) {
  const [signatureKey, setSignatureKey] = useState(currentSignatureKey);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleUpload = useCallback(async (file: File) => {
    clearMessages();

    // Client-side validation
    if (!file.type.startsWith("image/png")) {
      setError("Format non supporté. Utilisez PNG uniquement.");
      return;
    }

    if (file.size > 500 * 1024) {
      setError("Le fichier dépasse 500 KB.");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/garages/branding/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mime: file.type,
          size: file.size,
        }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok || !presignData.ok) {
        throw new Error(presignData?.error?.message || "Erreur lors de la préparation");
      }

      const { strategy, method, url, headers, key } = presignData.data;

      // Step 2: Upload file
      if (strategy === "s3") {
        // Direct S3 upload
        const uploadRes = await fetch(url, {
          method,
          headers,
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Erreur lors de l'upload vers le stockage");
        }
      } else {
        // Local upload fallback
        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);

        const uploadRes = await fetch(url, {
          method,
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Erreur lors de l'upload local");
        }
      }

      setSignatureKey(key);
      setSuccess("Signature mise à jour avec succès !");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleUpload]
  );

  const handleDelete = useCallback(async () => {
    clearMessages();
    setDeleting(true);

    try {
      const res = await fetch("/api/garages/branding/signature", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Erreur lors de la suppression");
      }

      setSignatureKey(null);
      setSuccess("Signature supprimée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }, []);

  // Feature not available
  if (!hasBrandingFeature) {
    return (
      <div className="ms-card">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
              <PenTool size={22} className="text-[var(--ms-primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--ms-text)]">Signature Garage</h3>
              <p className="text-sm text-[var(--ms-text-secondary)]">
                Pré-remplissez vos PV
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--ms-warning-light)] border border-[var(--ms-warning)]">
            <div className="flex items-center gap-2 text-[#B45309]">
              <Crown size={18} />
              <span className="font-medium">Fonctionnalité Premium</span>
            </div>
            <p className="text-sm text-[var(--ms-text-secondary)] mt-2">
              La signature pré-remplie sur les PV est disponible
              à partir du plan <strong>Essentiel</strong>.
            </p>
            <p className="text-xs text-[var(--ms-text-secondary)] mt-1">
              Plan actuel : {planName}
            </p>
          </div>

          <a href="/billing" className="ms-btn ms-btn-primary w-full mt-4">
            <Crown size={16} />
            Passer au plan Essentiel
          </a>
        </div>
      </div>
    );
  }

  // Feature available
  return (
    <div className="ms-card">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ms-primary-light)]">
            <PenTool size={22} className="text-[var(--ms-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--ms-text)]">Signature Garage</h3>
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Apparaît sur les PV de restitution
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--ms-error-light)] text-[var(--ms-error)] text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-[var(--ms-success-light)] text-[var(--ms-success)] text-sm mb-4 flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Signature Preview */}
        <div className="mb-4">
          {signatureKey ? (
            <div className="relative group">
              <div className="w-full h-24 rounded-xl border-2 border-dashed border-[var(--ms-border)] bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={`/api/public/garage-signature/${garageId}`}
                  alt="Signature du garage"
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--ms-error)] text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Supprimer la signature"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-[var(--ms-border)] bg-[var(--ms-bg-subtle)] flex flex-col items-center justify-center text-[var(--ms-text-secondary)]">
              <PenTool size={28} className="mb-2 opacity-50" />
              <span className="text-sm">Aucune signature</span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
          variant={signatureKey ? "secondary" : "primary"}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload size={16} />
              {signatureKey ? "Remplacer la signature" : "Uploader une signature"}
            </>
          )}
        </Button>

        <p className="text-xs text-[var(--ms-text-secondary)] mt-3 text-center">
          Format : PNG avec fond transparent • Taille max : 500 KB
        </p>
      </div>
    </div>
  );
}
