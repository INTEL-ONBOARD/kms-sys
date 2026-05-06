"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  layout?: "vertical" | "horizontal";
  gap?: "sm" | "md" | "lg";
}

const gapStyles = {
  sm: "space-y-3",
  md: "space-y-5",
  lg: "space-y-7",
};

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ layout = "vertical", gap = "md", className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(gapStyles[gap], layout === "horizontal" && "grid grid-cols-1 md:grid-cols-2 gap-x-6", className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right";
}

export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ align = "right", className, children, ...props }, ref) => {
    const alignStyles = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-4 pt-4", alignStyles[align], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormActions.displayName = "FormActions";

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, description, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-bold text-[#2D3748]">{title}</h3>}
            {description && <p className="text-sm text-[#A0AEC0] mt-1">{description}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

FormSection.displayName = "FormSection";
