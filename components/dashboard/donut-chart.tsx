"use client";

import { cn } from "@/lib/cn";

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DonutChart({
  data,
  loading = false,
  emptyMessage = "Aucune donnée",
  className,
}: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className="relative h-40 w-40">
          <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--ms-bg)]" />
        </div>
        <div className="mt-4 flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 w-20 animate-pulse rounded bg-[var(--ms-bg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={cn("flex h-48 items-center justify-center", className)}>
        <p className="text-sm text-[var(--ms-text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  // Calculate stroke-dasharray and offset for each segment
  let cumulativeOffset = 0;
  const segments = data.map((d) => {
    const pct = (d.value / total) * 100;
    const segment = {
      ...d,
      pct,
      offset: cumulativeOffset,
    };
    cumulativeOffset += pct;
    return segment;
  });

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Donut Chart */}
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="var(--ms-bg)"
            strokeWidth="4"
          />
          {/* Data segments */}
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={seg.color}
              strokeWidth="4"
              strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
              strokeDashoffset={`-${seg.offset}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--ms-text)]">{total}</div>
            <div className="text-xs font-medium text-[var(--ms-text-muted)]">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {data.map((d, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm text-[var(--ms-text-secondary)]">
              {d.label} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
