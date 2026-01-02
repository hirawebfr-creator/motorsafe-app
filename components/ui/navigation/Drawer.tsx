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
      ? "w-full max-h-[85vh] rounded-t-[var(--r)]"
      : "h-full w-[88vw] max-w-[320px]";

  const sideClass =
    side === "right"
      ? "ml-auto"
      : side === "bottom"
      ? "mt-auto"
      : "";

  const borderClass = side === "bottom" ? "border-t" : side === "right" ? "border-l" : "border-r";

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        className={`${sideClass} relative ${panelClass} ${borderClass} border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)]`}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[color:var(--text)]">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-xs text-[color:var(--textMuted)] hover:bg-white/5"
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
