"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconGradient?: string;
  link?: {
    href: string;
    label: string;
  };
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
  };
  loading?: boolean;
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconGradient = "from-[var(--ms-primary)] to-[#8B5CF6]",
  link,
  trend,
  loading = false,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--ms-border)]",
        "bg-white p-5 shadow-sm transition-all duration-200",
        "hover:border-[var(--ms-primary-light)] hover:shadow-md",
        "ms-animate-slide-up",
        className
      )}
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--ms-primary)]/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--ms-text-secondary)]">{label}</p>
          <div className="mt-1">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-[var(--ms-bg)]" />
            ) : (
              <p className="text-2xl font-bold text-[var(--ms-text)] tracking-tight">
                {value}
              </p>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br shadow-sm",
            iconGradient
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="relative mt-4">
        {link && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ms-primary)] transition-colors hover:text-[var(--ms-primary-dark)]"
          >
            {link.label}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              trend.direction === "up" && "text-[var(--ms-success)]",
              trend.direction === "down" && "text-[var(--ms-error)]",
              trend.direction === "neutral" && "text-[var(--ms-text-muted)]"
            )}
          >
            {trend.direction === "up" && <TrendingUp className="h-4 w-4" />}
            {trend.direction === "down" && <TrendingDown className="h-4 w-4" />}
            {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}
