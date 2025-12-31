import { ReactNode } from "react";

export default function DataTable({ columns, data }: { columns: { key: string, label: string, render?: (row: any) => ReactNode }[], data: any[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl shadow-card">
      <table className="min-w-full bg-[var(--panel)] text-[var(--text)]">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-[var(--muted)] border-b border-[var(--border)]">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-8 text-center text-[var(--muted)]">Aucune donnée</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-[var(--panel-2)]/60 transition">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 border-b border-[var(--border)] text-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
