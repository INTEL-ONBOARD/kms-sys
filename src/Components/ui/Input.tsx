"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col", className)}>
        {label && (
          <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition",
              error && "border-red-300 focus:border-red-500 focus:ring-red-500",
              props.disabled && "bg-gray-100 text-gray-400 cursor-not-allowed",
              icon && "pr-10"
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs font-medium text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
