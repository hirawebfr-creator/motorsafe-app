type DataTableProps = {
  stickyHeader?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function DataTable({ stickyHeader = false, className = "", children }: DataTableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-[var(--r)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--sh)] ${className}`}
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
      className={`text-left text-xs uppercase tracking-[0.2em] text-[color:var(--textMuted)] ${
        sticky ? "sticky top-0 bg-[color:var(--surface2)]/95 backdrop-blur" : ""
      }`}
    >
      {children}
    </thead>
  );
}
