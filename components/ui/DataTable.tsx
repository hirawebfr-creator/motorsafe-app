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
        variant === "card" ? "ms-card overflow-x-auto" : "overflow-x-auto",
        className
      )}
    >
      <table className="ms-table text-sm">{children}</table>
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
        sticky ? "sticky top-0 z-10 border-b border-border/60 bg-surface/90 backdrop-blur" : ""
      )}
    >
      {children}
    </thead>
  );
}
