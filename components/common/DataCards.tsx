import { ReactNode } from "react";

export default function DataCards({ data, render }: { data: any[], render: (row: any) => ReactNode }) {
  if (!data.length) return <div className="card p-8 text-center text-[var(--muted)]">Aucune donnée</div>;
  return (
    <div className="flex flex-col gap-4">
      {data.map((row, i) => (
        <div key={i} className="card p-4">{render(row)}</div>
      ))}
    </div>
  );
}
