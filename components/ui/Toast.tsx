"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[rgba(34,197,94,0.45)] text-[#bbf7d0]",
  error: "border-[rgba(239,68,68,0.5)] text-[#fecaca]",
  info: "border-[rgba(96,165,250,0.45)] text-[#bfdbfe]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = (toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: ToastItem = { id, ...toast };
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-[280px] rounded-[var(--radius-sm)] border bg-[rgba(15,18,30,0.92)] px-4 py-3 shadow-[var(--shadow-soft)] ${variantStyles[toast.variant]}`}
          >
            <p className="text-sm font-semibold text-[var(--text)]">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-xs text-[var(--muted)]">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("ToastProvider is missing.");
  }
  return ctx;
}
