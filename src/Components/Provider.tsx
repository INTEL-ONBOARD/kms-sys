"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./ToastProvider";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}