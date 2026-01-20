"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface KpiCardProps {
  title: string;
  value: string | number;
  variation?: number; // Pourcentage variation (ex: 12.5 = +12.5%)
  icon?: "wrench" | "euro" | "users" | "car";
  sparkline?: number[]; // Données mini-graphique (optionnel)
  className?: string;
}

const iconMap = {
  wrench: "🔧",
  euro: "€",
  users: "👥",
  car: "🚗",
};

export function KpiCard({
  title,
  value,
  variation,
  icon,
  sparkline,
  className,
}: KpiCardProps) {
  const isPositive = variation !== undefined && variation > 0;
  const isNegative = variation !== undefined && variation < 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--ms-border)]",
        "bg-white p-6 shadow-sm transition-all duration-200",
        "hover:border-[var(--ms-primary-light)] hover:shadow-md",
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--ms-primary)]/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[var(--ms-text-secondary)]">{title}</p>
        {icon && <span className="text-2xl">{iconMap[icon]}</span>}
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-[var(--ms-text)] tracking-tight">
            {value}
          </p>

          {variation !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm mt-1",
                isPositive && "text-[var(--ms-success)]",
                isNegative && "text-[var(--ms-error)]",
                !isPositive && !isNegative && "text-[var(--ms-text-muted)]"
              )}
            >
              {isPositive && <ArrowUp className="h-4 w-4" />}
              {isNegative && <ArrowDown className="h-4 w-4" />}
              <span>{isPositive ? "+" : ""}{variation}%</span>
              <span className="text-[var(--ms-text-muted)]">vs mois dernier</span>
            </div>
          )}
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="h-12 w-24">
            {/* Mini sparkline SVG */}
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <polyline
                points={sparkline
                  .map(
                    (val, i) =>
                      `${(i / (sparkline.length - 1)) * 100},${50 - val}`
                  )
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--ms-primary)]"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
