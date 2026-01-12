"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

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
  success: "border-success/35 bg-surface",
  error: "border-danger/35 bg-surface",
  info: "border-primary/30 bg-surface",
};

const variantIcon: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
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
        {toasts.map((toast) => {
          const Icon = variantIcon[toast.variant];
          return (
            <div
              key={toast.id}
              className={`w-[340px] rounded-[var(--r)] border px-4 py-3 shadow-[var(--shDropdown)] ${variantStyles[toast.variant]}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface2">
                  <Icon
                    size={18}
                    className={
                      toast.variant === "success"
                        ? "text-success"
                        : toast.variant === "error"
                          ? "text-danger"
                          : "text-primary"
                    }
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-xs text-muted2">{toast.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
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
