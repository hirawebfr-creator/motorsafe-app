import { Card } from "@/components/ui/Card";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border border-danger/35 bg-danger/8">
      <p className="text-sm text-danger/90">{message}</p>
    </Card>
  );
}
