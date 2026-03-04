"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./components/Toast";
import SessionWarning from "./components/SessionWarning";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <SessionWarning />
      </ToastProvider>
    </SessionProvider>
  );
}
