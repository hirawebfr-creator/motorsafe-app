"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowUpRight, LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  headerAction?: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardCard({
  title,
  subtitle,
  headerAction,
  children,
  className,
  noPadding = false,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--ms-border)]",
        "bg-white shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--ms-border)] bg-[var(--ms-bg)]/30 px-5 py-4">
        <div>
          <h3 className="font-semibold text-[var(--ms-text)]">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--ms-text-muted)]">{subtitle}</p>
          )}
        </div>
        {headerAction && (
          <Link
            href={headerAction.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ms-primary)] transition-colors hover:text-[var(--ms-primary-dark)]"
          >
            {headerAction.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {/* Body */}
      <div className={cn(noPadding ? "" : "p-5")}>{children}</div>
    </div>
  );
}

interface ActivityItemProps {
  icon: LucideIcon;
  iconGradient?: string;
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  href?: string;
}

export function ActivityItem({
  icon: Icon,
  iconGradient = "from-[var(--ms-primary)] to-[#8B5CF6]",
  title,
  subtitle,
  rightContent,
  href,
}: ActivityItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-4 transition-colors",
        href && "hover:bg-[var(--ms-bg)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            "bg-gradient-to-br",
            iconGradient
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--ms-text)]">{title}</p>
          <p className="truncate text-sm text-[var(--ms-text-muted)]">{subtitle}</p>
        </div>
      </div>
      {rightContent && <div className="ml-4 flex-shrink-0">{rightContent}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
