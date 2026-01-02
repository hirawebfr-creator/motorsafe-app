import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className = "", label, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-xs text-muted2">
      {label ? <span className="ms-kicker">{label}</span> : null}
      <textarea
        className={cn("ms-input min-h-[120px] resize-y py-3 text-sm outline-none", className)}
        {...props}
      />
    </label>
  );
}
