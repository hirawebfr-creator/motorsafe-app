"use client";

import { cn } from "@/lib/cn";

interface BarChartProps {
  labels: string[];
  values: number[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function BarChart({
  labels,
  values,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  className,
}: BarChartProps) {
  const max = Math.max(1, ...values);

  if (loading) {
    return (
      <div className={cn("h-64 flex items-end justify-between gap-2", className)}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full animate-pulse rounded-t-md bg-[var(--ms-bg)]"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
            <div className="mt-2 h-3 w-8 animate-pulse rounded bg-[var(--ms-bg)]" />
          </div>
        ))}
      </div>
    );
  }

  if (values.length === 0) {
    return (
      <div className={cn("flex h-64 items-center justify-center", className)}>
        <p className="text-sm text-[var(--ms-text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-64", className)}>
      <div className="flex h-full items-end justify-between gap-2">
        {values.map((value, idx) => {
          const pct = (value / max) * 100;
          return (
            <div
              key={`${idx}-${labels[idx]}`}
              className="group relative flex flex-1 flex-col items-center"
            >
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-300",
                  "bg-gradient-to-t from-[var(--ms-primary)] to-[#8B5CF6]",
                  "hover:from-[var(--ms-primary-dark)] hover:to-[#7C3AED]",
                  "shadow-sm"
                )}
                style={{ height: `${Math.max(4, pct)}%` }}
              />
              {/* Label */}
              <span className="mt-2 text-xs font-medium text-[var(--ms-text-muted)]">
                {labels[idx]}
              </span>
              {/* Tooltip */}
              <div
                className={cn(
                  "pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2",
                  "rounded-lg bg-[var(--ms-text)] px-3 py-1.5 text-xs font-medium text-white",
                  "opacity-0 transition-opacity shadow-lg",
                  "group-hover:opacity-100"
                )}
              >
                {value}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--ms-text)]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
