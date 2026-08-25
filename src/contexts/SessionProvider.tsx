"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./ToastContext";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}