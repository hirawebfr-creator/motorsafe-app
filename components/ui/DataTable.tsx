type DataTableProps = {
  stickyHeader?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function DataTable({ stickyHeader = false, className = "", children }: DataTableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius)] border border-[rgba(31,41,55,0.7)] bg-[var(--card)] shadow-[var(--shadow-soft)] ${className}`}
    >
      <table className="w-full text-sm">{children}</table>
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
      className={`text-left text-xs uppercase tracking-[0.2em] text-[var(--muted)] ${
        sticky ? "sticky top-0 bg-[var(--card-strong)]/95 backdrop-blur" : ""
      }`}
    >
      {children}
    </thead>
  );
}
