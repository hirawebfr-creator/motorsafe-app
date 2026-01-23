import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, containerClassName, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-[#374151] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
            "placeholder:text-[#9ca3af]",
            "focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]/20 focus:border-[#1a1a2e]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f3f4f6]",
            error 
              ? "border-[#dc2626] focus:ring-[#dc2626]/20 focus:border-[#dc2626]" 
              : "border-[#e5e5e5] hover:border-[#d0d0d0]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[#dc2626]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-[#6b7280]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
