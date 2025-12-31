"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, User } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-[var(--panel)] border-b border-[var(--border)] px-2 md:px-0 py-3 mb-6">
      <div className="flex-1 max-w-xs">
        <Input
          placeholder="Rechercher..."
          className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)]"
          aria-label="Recherche"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" className="flex items-center gap-2">
          <Plus size={16} /> Nouveau
        </Button>
        <div className="h-9 w-9 rounded-full bg-[var(--panel-2)] flex items-center justify-center border border-[var(--border)]">
          <User size={20} className="text-[var(--muted)]" />
        </div>
      </div>
    </header>
  );
}
