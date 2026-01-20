"use client";

import { cn } from "@/lib/cn";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 5, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full rounded-lg bg-gradient-to-r from-[var(--ms-bg-subtle)] via-[var(--ms-border-light)] to-[var(--ms-bg-subtle)] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border border-[var(--ms-border)] bg-white p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-24 rounded bg-[var(--ms-bg-subtle)] animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-[var(--ms-bg-subtle)] animate-pulse" />
      </div>
      <div className="h-8 w-16 rounded bg-[var(--ms-bg-subtle)] animate-pulse mb-2" />
      <div className="h-4 w-20 rounded bg-[var(--ms-bg-subtle)] animate-pulse" />
    </div>
  );
}

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns = 5, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-[var(--ms-border)] overflow-hidden", className)}>
      {/* Header */}
      <div
        className="grid gap-4 p-4 bg-[var(--ms-bg-subtle)] border-b border-[var(--ms-border)]"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-[var(--ms-border)] animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-4 p-4 border-b border-[var(--ms-border-light)] last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-4 rounded bg-[var(--ms-bg-subtle)] animate-pulse"
              style={{ width: `${60 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
