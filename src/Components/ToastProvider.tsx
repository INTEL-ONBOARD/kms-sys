"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from "react-icons/fi";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
    warning: (msg: string) => addToast("warning", msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          let bg = "bg-blue-50 border-blue-200 text-blue-800";
          let icon = <FiInfo className="text-blue-600 text-lg flex-shrink-0" />;

          if (t.type === "success") {
            bg = "bg-green-50 border-green-200 text-green-800";
            icon = <FiCheckCircle className="text-green-600 text-lg flex-shrink-0" />;
          } else if (t.type === "error") {
            bg = "bg-red-50 border-red-200 text-red-800";
            icon = <FiAlertCircle className="text-red-600 text-lg flex-shrink-0" />;
          } else if (t.type === "warning") {
            bg = "bg-amber-50 border-amber-200 text-amber-800";
            icon = <FiAlertTriangle className="text-amber-600 text-lg flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-x-0 ${bg}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium">{t.text}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-3 text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
