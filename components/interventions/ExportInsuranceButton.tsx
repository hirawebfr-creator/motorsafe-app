"use client";

/**
 * INSURANCE-READY-EXPORT-02: Export Insurance Button Component
 * 
 * Provides UI for exporting intervention as insurance-ready ZIP
 * and creating/managing share links (PRO only).
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share2, Link2, Copy, Check, Clock, Trash2, FileArchive, Loader2, ExternalLink } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface ExportInsuranceButtonProps {
  interventionId: string;
  vehiclePlate?: string;
  hasExportZip: boolean;
  hasExportShare: boolean;
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
  onSuccess,
}: ExportInsuranceButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
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
        <Badge variant="secondary" className="ml-2 text-xs">PRO</Badge>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4 mr-2" />
            )}
            Export assurance
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le dossier ZIP
          </DropdownMenuItem>
          
          {hasExportShare && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openShareDialog}>
                <Share2 className="h-4 w-4 mr-2" />
                Créer un lien de partage
                <Badge variant="outline" className="ml-auto text-xs">PRO</Badge>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Lien de partage
            </DialogTitle>
            <DialogDescription>
              Créez un lien sécurisé pour partager le dossier avec un expert ou assureur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {shareStatus?.hasLink && !shareStatus.isExpired ? (
              // Link exists
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Expire le {new Date(shareStatus.expiresAt!).toLocaleDateString("fr-FR")}
                  {shareStatus.wasUsed && (
                    <Badge variant="secondary" className="ml-auto">Utilisé</Badge>
                  )}
                </div>

                {shareLink ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted truncate"
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
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={shareLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
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
                  className="w-full text-destructive hover:text-destructive"
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
              // No link or expired
              <div className="space-y-3">
                {shareStatus?.isExpired && (
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500 text-sm">
                    Le lien précédent a expiré. Créez-en un nouveau.
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={createShareLink}
                  disabled={isCreatingLink}
                >
                  {isCreatingLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Créer un lien (valide 7 jours)
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Le lien sera accessible sans connexion pendant 7 jours.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
