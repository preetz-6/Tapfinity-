"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const WARN_BEFORE_MS = 5 * 60 * 1000;

export default function SessionWarning() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [minsLeft, setMinsLeft] = useState(5);

  useEffect(() => {
    if (!session?.expires) return;
    const check = () => {
      const msLeft = new Date(session.expires).getTime() - Date.now();
      const mins = Math.ceil(msLeft / 60_000);
      setMinsLeft(Math.max(0, mins));
      setShow(msLeft > 0 && msLeft < WARN_BEFORE_MS);
      if (msLeft <= 0) signOut({ callbackUrl: "/" });
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [session?.expires]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs w-full">
      <div className="rounded-2xl bg-[#0d1829] border border-amber-500/30 shadow-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Session expiring soon</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Your session expires in ~{minsLeft} min{minsLeft !== 1 ? "s" : ""}. Any in-progress payment will be interrupted.
          </p>
        </div>
        <button onClick={() => setShow(false)}
          className="text-gray-600 hover:text-gray-400 transition flex-shrink-0 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}
