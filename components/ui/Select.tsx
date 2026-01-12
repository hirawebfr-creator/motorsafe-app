import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
};

export function Select({ className = "", containerClassName = "", label, helperText, error, id, children, ...props }: SelectProps) {
  const describedBy = error ? `${id ?? ""}-error` : helperText ? `${id ?? ""}-help` : undefined;
  return (
    <label className={cn("grid gap-2", containerClassName)}>
      {label ? <span className="mb-1 block text-[12px] font-medium text-[#030229]/65">{label}</span> : null}
      <select
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-[10px] border border-black/10 bg-[#FAFAFB] px-3 text-[14px] text-[#030229] outline-none transition-colors focus:border-[#605BFF]/40 focus:ring-2 focus:ring-[#605BFF]/25",
          error ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/15" : "",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id ?? ""}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id ?? ""}-help`} className="text-xs text-[#030229]/60">
          {helperText}
        </p>
      ) : null}
    </label>
  );
}
