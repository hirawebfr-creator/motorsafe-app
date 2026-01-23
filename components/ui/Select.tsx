"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: SelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  containerClassName?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, error, label, placeholder, helperText, id, onChange, containerClassName, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-[#374151] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-10 w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]/20 focus:border-[#1a1a2e]",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f3f4f6]",
              error 
                ? "border-[#dc2626] focus:ring-[#dc2626]/20 focus:border-[#dc2626]" 
                : "border-[#e5e5e5] hover:border-[#d0d0d0]",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[#dc2626]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[#6b7280]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
