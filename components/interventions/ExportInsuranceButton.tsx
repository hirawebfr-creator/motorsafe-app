"use client";

/**
 * INSURANCE-READY-EXPORT-02: Export Insurance Button Component
 * 
 * Provides UI for exporting intervention as insurance-ready ZIP
 * and creating/managing share links (PRO only).
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownItem } from "@/components/ui/DropdownMenu";
import { ConfirmDialog as Dialog } from "@/components/ui/ConfirmDialog";
import { Download, Share2, Link2, Copy, Check, Clock, Trash2, FileArchive, Loader2, ExternalLink, FileText } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface ExportInsuranceButtonProps {
  interventionId: string;
  vehiclePlate?: string;
  hasExportZip: boolean;
  hasExportShare: boolean;
  hasExpertPack?: boolean;
  onSuccess?: () => void;
}

interface ShareLinkStatus {
  hasLink: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  wasUsed?: boolean;
}

interface ShareLinkResult {
  shareUrl: string;
  expiresAt: string;
  expiresInDays: number;
}

function isSuccess<T>(resp: unknown): resp is { ok: true; data: T } {
  return typeof resp === "object" && resp !== null && (resp as Record<string, unknown>).ok === true;
}

export function ExportInsuranceButton({
  interventionId,
  vehiclePlate,
  hasExportZip,
  hasExportShare,
  hasExpertPack = false,
  onSuccess,
}: ExportInsuranceButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExpert, setIsExportingExpert] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareLinkStatus | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isRevokingLink, setIsRevokingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Download ZIP directly
  const handleExport = useCallback(async () => {
    if (!hasExportZip) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = `/api/interventions/${interventionId}/export-insurance`;
      link.download = `export_${vehiclePlate || interventionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Wait a bit for download to start
      await new Promise(r => setTimeout(r, 1000));
      onSuccess?.();
    } catch (err) {
      console.error("Export error:", err);
      setError("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [interventionId, vehiclePlate, hasExportZip, onSuccess]);

  // Download Expert Pack PDF
  const handleExportExpert = useCallback(async () => {
    if (!hasExpertPack) return;
    
    setIsExportingExpert(true);
    setError(null);
    
    try {
      const link = document.createElement("a");
      link.href = `/api/interventions/${interventionId}/export-expert-pack.pdf`;
      link.download = `dossier_expert_${vehiclePlate || interventionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await new Promise(r => setTimeout(r, 1000));
      onSuccess?.();
    } catch (err) {
      console.error("Expert export error:", err);
      setError("Erreur lors de l'export du dossier expert");
    } finally {
      setIsExportingExpert(false);
    }
  }, [interventionId, vehiclePlate, hasExpertPack, onSuccess]);

  // Check share link status
  const checkShareStatus = useCallback(async () => {
    if (!hasExportShare) return;
    
    try {
      const resp = await fetcher<ShareLinkStatus>(
        `/api/interventions/${interventionId}/export-share`,
        { method: "GET" }
      );
      
      if (isSuccess<ShareLinkStatus>(resp)) {
        setShareStatus(resp.data);
      }
    } catch {
      // Ignore
    }
  }, [interventionId, hasExportShare]);

  // Open share dialog and check status
  const openShareDialog = useCallback(async () => {
    setShareDialogOpen(true);
    setError(null);
    await checkShareStatus();
  }, [checkShareStatus]);

  // Create share link
  const createShareLink = useCallback(async () => {
    if (!hasExportShare) return;
    
    setIsCreatingLink(true);
    setError(null);
    
    try {
      const resp = await fetcher<ShareLinkResult>(
        `/api/interventions/${interventionId}/export-share`,
        { method: "POST" }
      );
      
      if (isSuccess<ShareLinkResult>(resp)) {
        setShareLink(resp.data.shareUrl);
        setShareStatus({
          hasLink: true,
          isExpired: false,
          expiresAt: resp.data.expiresAt,
        });
      } else {
        setError("Erreur lors de la création du lien");
      }
    } catch {
      setError("Erreur lors de la création du lien");
    } finally {
      setIsCreatingLink(false);
    }
  }, [interventionId, hasExportShare]);

  // Revoke share link
  const revokeShareLink = useCallback(async () => {
    setIsRevokingLink(true);
    setError(null);
    
    try {
      const resp = await fetcher(
        `/api/interventions/${interventionId}/export-share`,
        { method: "DELETE" }
      );
      
      if (isSuccess<{ revoked: boolean }>(resp)) {
        setShareLink(null);
        setShareStatus({ hasLink: false });
      }
    } catch {
      setError("Erreur lors de la révocation");
    } finally {
      setIsRevokingLink(false);
    }
  }, [interventionId]);

  // Copy link to clipboard
  const copyLink = useCallback(() => {
    if (!shareLink) return;
    
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink]);

  if (!hasExportZip) {
    return (
      <Button variant="outline" size="sm" disabled title="Plan supérieur requis">
        <Download className="h-4 w-4 mr-2" />
        Export assurance
        <Badge variant="neutral" className="ml-2 text-xs">PRO</Badge>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4 mr-2" />
            )}
            Export assurance
          </Button>
        }
        align="right"
      >
        <DropdownItem onClick={handleExport}>
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Télécharger le dossier ZIP
          </span>
        </DropdownItem>
        
        {hasExpertPack && (
          <DropdownItem onClick={isExportingExpert ? undefined : handleExportExpert}>
            <span className="flex items-center gap-2">
              {isExportingExpert ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Dossier Expert (PDF)
              <Badge variant="accent" className="ml-auto text-xs">PRO</Badge>
            </span>
          </DropdownItem>
        )}
        
        {hasExportShare && (
          <DropdownItem onClick={openShareDialog}>
            <span className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Créer un lien de partage
              <Badge variant="accent" className="ml-auto text-xs">PRO</Badge>
            </span>
          </DropdownItem>
        )}
      </DropdownMenu>

      {/* Share Link Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen}
        title="Lien de partage"
        description="Créez un lien sécurisé pour partager le dossier avec un expert ou assureur."
        confirmLabel={shareStatus?.hasLink && !shareStatus.isExpired ? "Fermer" : "Créer un lien"}
        cancelLabel="Annuler"
        onConfirm={shareStatus?.hasLink && !shareStatus.isExpired ? () => setShareDialogOpen(false) : createShareLink}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {shareStatus?.hasLink && !shareStatus.isExpired ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted2">
                <Clock className="h-4 w-4" />
                Expire le {new Date(shareStatus.expiresAt!).toLocaleDateString("fr-FR")}
                {shareStatus.wasUsed && (
                  <Badge variant="neutral" className="ml-auto">Utilisé</Badge>
                )}
              </div>

              {shareLink ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-surface2 truncate"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <a href={shareLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={createShareLink}
                  disabled={isCreatingLink}
                >
                  {isCreatingLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Afficher le lien
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-600 hover:text-red-700"
                onClick={revokeShareLink}
                disabled={isRevokingLink}
              >
                {isRevokingLink ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Révoquer le lien
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shareStatus?.isExpired && (
                <div className="p-3 rounded-md bg-amber-50 text-amber-700 text-sm">
                  Le lien précédent a expiré. Créez-en un nouveau.
                </div>
              )}

              <p className="text-xs text-muted2 text-center">
                Le lien sera accessible sans connexion pendant 7 jours.
              </p>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
