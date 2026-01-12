"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockBodyScroll } from "@/lib/scrollLock";

type DrawerSide = "left" | "right" | "bottom";

/**
 * Drawer
 * - Used for mobile sidebar and bottom sheets.
 * - Minimal, token-based styling.
 */
export default function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (!mounted || !open) return null;

  const Z_OVERLAY = 2147483000;
  const Z_PANEL = Z_OVERLAY + 1;

  const panelClass = [
    "bg-bg border border-border shadow-xl backdrop-blur outline-none",
    "transform transition-transform duration-200 ease-out",
  ].join(" ");

  const overlayClass = "bg-black/45 transition-opacity duration-200 opacity-100";

  const panelStyle: React.CSSProperties =
    side === "bottom"
      ? {
          position: "fixed",
          zIndex: Z_PANEL,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxHeight: "85dvh",
          borderTopLeftRadius: "var(--r)",
          borderTopRightRadius: "var(--r)",
        }
      : {
          position: "fixed",
          zIndex: Z_PANEL,
          top: 0,
          bottom: 0,
          height: "100dvh",
          width: "min(92vw, 380px)",
          left: side === "left" ? 0 : undefined,
          right: side === "right" ? 0 : undefined,
        };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: Z_OVERLAY,
    inset: 0,
  };

  const contentClass =
    side === "bottom"
      ? "max-h-[calc(85dvh-56px)] overflow-y-auto p-4"
      : "max-h-[calc(100dvh-56px)] overflow-y-auto p-4";

  const root = (
    <>
      <div className={overlayClass} style={overlayStyle} onClick={onClose} aria-hidden="true" />
      <div
        className={panelClass}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Drawer"}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-text">{title ?? "Navigation"}</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted2 transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className={contentClass}>{children}</div>
      </div>
    </>
  );

  return createPortal(root, document.body);
}
