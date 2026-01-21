"use client";

import { Card } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconGradient?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
  loading?: boolean;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconGradient = "from-[var(--ms-primary)] to-[#8B5CF6]",
  trend,
  loading,
  delay = 0,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        delay > 0 && `ms-animate-slide-up ms-delay-${delay}`
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--ms-text-muted)]">{label}</div>
          <div className="text-2xl font-bold mt-1">
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-[var(--ms-bg)]" />
            ) : (
              value
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
              iconGradient
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      {trend && !loading && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1 text-sm",
            trend.direction === "up" ? "text-[var(--ms-success)]" : "text-[var(--ms-error)]"
          )}
        >
          {trend.label}
        </div>
      )}
    </Card>
  );
}
