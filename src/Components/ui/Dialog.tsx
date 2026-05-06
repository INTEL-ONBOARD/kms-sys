"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnOverlayClick?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-2xl w-full mx-4 p-6 transform transition-all",
          sizeStyles[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className={cn("mb-4", description && "mb-6")}>
            {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps extends Omit<DialogProps, "children" | "footer"> {
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  isConfirming?: boolean;
}

export function ConfirmDialog({
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "danger",
  isConfirming = false,
  ...dialogProps
}: ConfirmDialogProps) {
  return (
    <Dialog
      {...dialogProps}
      footer={
        <>
          <Button variant="secondary" onClick={dialogProps.onClose}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {dialogProps.description && (
        <p className="text-sm text-gray-600">{dialogProps.description}</p>
      )}
    </Dialog>
  );
}
