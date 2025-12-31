import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: number | string;
  badge?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {badge ? <Badge variant="accent">{badge}</Badge> : null}
    </Card>
  );
}
