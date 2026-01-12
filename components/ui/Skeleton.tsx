type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--rGlobal)] bg-surface2/70 ${className}`}
    />
  );
}
