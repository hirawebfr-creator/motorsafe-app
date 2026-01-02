import type { ReactNode, JSX } from "react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  title,
  description,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2 | 3 | 4;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <Tag
          className={cn(
            "font-display text-text font-semibold tracking-tight leading-tight",
            level <= 2 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          )}
        >
          {title}
        </Tag>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted2">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-1 md:pt-0">{action}</div> : null}
    </div>
  );
}
