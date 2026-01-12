import { Card } from "@/components/ui/Card";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-surface2">
        {icon ?? <Inbox size={20} className="text-primary2" />}
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted2">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}
