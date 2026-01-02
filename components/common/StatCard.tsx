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
    <Card className="relative flex flex-col gap-3 overflow-hidden">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />
      <p className="ms-kicker">{label}</p>
      <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
      {badge ? <Badge variant="accent">{badge}</Badge> : null}
    </Card>
  );
}
