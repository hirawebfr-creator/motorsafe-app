import { Card } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-[color:var(--textMuted)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}
