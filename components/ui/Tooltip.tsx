import * as React from "react";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
};

export function Tooltip({ content, children, side = "top", disabled }: TooltipProps) {
  // Simple fallback: show content as title if not disabled
  if (disabled || !content) return <>{children}</>;
  return (
    <span title={typeof content === "string" ? content : undefined} style={{ position: "relative", display: "inline-flex" }}>
      {children}
    </span>
  );
}
