import { Card } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-danger/35 bg-danger/8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-danger/35 bg-danger/10">
          <AlertTriangle size={18} className="text-danger" />
        </span>
        <p className="text-sm text-danger/90">{message}</p>
      </div>
    </Card>
  );
}
