import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type KpiCardProps = {
  title: string;
  value: number | string;
  trend?: string;
  hint?: string;
};

export function KpiCard({ title, value, trend, hint }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-[rgba(139,92,246,0.18)] blur-2xl" />
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
        {trend ? <Badge variant="accent">{trend}</Badge> : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </Card>
  );
}
