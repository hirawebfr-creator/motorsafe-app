import React from "react";

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
  if (!open) return null;

  const panelClass =
    side === "bottom"
      ? "fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-[var(--r)] border-t"
      : side === "right"
      ? "fixed inset-y-0 right-0 h-full w-[88vw] max-w-[320px] border-l"
      : "fixed inset-y-0 left-0 h-full w-[88vw] max-w-[320px] border-r";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        className={`relative ${panelClass} border-border bg-surface/95 shadow-[var(--shDropdown)]`}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-transparent px-3 py-1.5 text-xs text-muted2 hover:bg-surface2"
            >
              Fermer
            </button>
          </div>
        ) : null}
        <div className="h-full overflow-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          {children}
        </div>
      </aside>
    </div>
  );
}
