import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-[var(--muted)]">{description}</p> : null}
    </Card>
  );
}
