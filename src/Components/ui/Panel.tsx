"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md";
  border?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const shadowStyles = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
};

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    { title, action, padding = "md", shadow = "sm", border = true, className, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-xl overflow-hidden",
          border && "border border-gray-100",
          shadowStyles[shadow],
          className
        )}
        {...props}
      >
        {(title || action) && (
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
            {title && <h3 className="font-bold text-[#2D3748]">{title}</h3>}
            {action && <div>{action}</div>}
          </div>
        )}
        <div className={cn(paddingStyles[padding], !title && !action && paddingStyles[padding])}>
          {children}
        </div>
      </div>
    );
  }
);

Panel.displayName = "Panel";
