"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QRCodeDialogProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export function QRCodeDialog({ url, title = "Scanner pour signer", onClose }: QRCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("signature-qr-code");
    if (!svg) return;

    // Clone SVG and convert to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2; // 2x for better quality
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "qr-signature.png";
      link.href = pngUrl;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--ms-bg)] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 ms-animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--ms-bg-subtle)] transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-xl mb-4">
          <QRCodeSVG
            id="signature-qr-code"
            value={url}
            size={220}
            level="H" // High error correction for better scanning
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Instructions */}
        <p className="text-center text-sm text-muted2 mb-4">
          Scannez ce QR code avec un smartphone pour ouvrir la page de signature.
        </p>

        {/* URL display */}
        <div className="p-3 bg-[var(--ms-bg-subtle)] rounded-lg text-xs text-muted2 break-all mb-4 font-mono">
          {url}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={copyLink}>
            {copied ? (
              <>
                <CheckCircle2 size={16} className="mr-1 text-[var(--ms-success)]" />
                Copié !
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                Copier le lien
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={downloadQR}>
            <Download size={16} className="mr-1" />
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
}
