import type { ReactNode, JSX } from "react";

export function SectionHeader({
  title,
  description,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2 | 3 | 4;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <Tag className="text-white font-bold text-2xl md:text-3xl tracking-tight leading-tight">
          {title}
        </Tag>
        {description ? (
          <p className="mt-1 text-sm text-gray-400 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-4 md:mt-0">{action}</div> : null}
    </div>
  );
}
