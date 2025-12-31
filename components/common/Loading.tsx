export function Loading({ label = "Chargement..." }: { label?: string }) {
  return <p className="text-sm text-[var(--muted)]">{label}</p>;
}
