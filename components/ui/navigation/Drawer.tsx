import React from "react";

/**
 * Drawer (for mobile sidebar)
 * - Appears from left or right, overlays content
 * - Use for mobile sidebar navigation
 */
export default function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-label="Fermer le menu" tabIndex={0} />
      <aside className="relative w-64 h-full bg-background border-r border-border flex flex-col animate-slide-in-left">
        {children}
      </aside>
    </div>
  );
}
