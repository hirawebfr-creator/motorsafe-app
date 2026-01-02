import { Skeleton } from "@/components/ui/Skeleton";

export function Loading({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <p className="text-xs text-[color:var(--textMuted)]">{label}</p>
    </div>
  );
}
