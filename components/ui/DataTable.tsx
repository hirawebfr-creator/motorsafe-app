import { cn } from "@/lib/cn";

type DataTableProps = {
  stickyHeader?: boolean;
  variant?: "card" | "plain";
  className?: string;
  children: React.ReactNode;
};

export function DataTable({
  stickyHeader = false,
  variant = "card",
  className = "",
  children,
}: DataTableProps) {
  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-[var(--r)] border border-border bg-surface shadow-soft overflow-hidden"
          : "",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="ms-table min-w-[720px] text-sm">{children}</table>
      </div>
      {stickyHeader ? null : null}
    </div>
  );
}

export function DataTableHead({
  sticky = false,
  children,
}: {
  sticky?: boolean;
  children: React.ReactNode;
}) {
  return (
    <thead
      className={cn(
        "text-left",
        sticky ? "sticky top-0 z-10 border-b border-border/70 bg-surface/95 backdrop-blur" : ""
      )}
    >
      {children}
    </thead>
  );
}
