"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

type Toast = { id: string; title: string; description?: string; variant?: "default" | "success" | "error" };

const ToastCtx = createContext<{ toast: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36);
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-lg bg-white border-[var(--border)] min-w-[260px] animate-fade-up",
              t.variant === "success" && "border-green-300 bg-green-50",
              t.variant === "error" && "border-red-300 bg-red-50"
            )}
          >
            <div className="font-medium text-sm text-[var(--ink)]">{t.title}</div>
            {t.description && <div className="text-xs text-[var(--ink-2)] mt-0.5">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { toast: () => {} };
  return ctx;
}
