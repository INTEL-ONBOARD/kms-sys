"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col", className)}>
        {label && (
          <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition appearance-none cursor-pointer",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500",
            props.disabled && "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs font-medium text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
