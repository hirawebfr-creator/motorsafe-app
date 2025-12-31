import { Card } from "@/components/ui/Card";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-red-500/30 bg-[rgba(255,80,80,0.08)]">
      <p className="text-sm text-red-400">{message}</p>
    </Card>
  );
}
