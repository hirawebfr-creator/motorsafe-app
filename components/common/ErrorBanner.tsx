import { Card } from "@/components/ui/Card";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)]">
      <p className="text-sm text-[#fecaca]">{message}</p>
    </Card>
  );
}
