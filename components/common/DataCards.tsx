import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export default function DataCards({ data, render }: { data: any[], render: (row: any) => ReactNode }) {
  if (!data.length) {
    return (
      <Card className="p-8 text-center text-[color:var(--textMuted)]">
        Aucune donnée
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {data.map((row, i) => (
        <Card key={i} className="p-4">
          {render(row)}
        </Card>
      ))}
    </div>
  );
}
