"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  error: "bg-red-500/15 border-red-500/30 text-red-400",
  info: "bg-blue-500/15 border-blue-500/30 text-blue-400",
  warning: "bg-amber-500/15 border-amber-500/30 text-amber-400",
};

const ICON_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-amber-500/20 text-amber-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl max-w-xs w-full pointer-events-auto animate-slide-in ${STYLES[t.type]}`}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ICON_STYLES[t.type]}`}>
              {ICONS[t.type]}
            </span>
            <p className="text-sm font-medium text-white/90">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
