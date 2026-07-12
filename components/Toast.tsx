"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";

/* -------------------------------------------------------------------------
   Lightweight toast system for transient feedback ("Request accepted",
   "Prescription sent", …). Mounted once in the root layout so any client
   component can call `useToast().show(message, tone)`.
   ---------------------------------------------------------------------- */

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{
  show: (message: string, tone?: Tone) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <span className="toast-icon">
              <Icon name={t.tone === "error" ? "close" : "check"} size={14} strokeWidth={2.4} />
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Show transient feedback. No-ops if a ToastProvider isn't mounted. */
export function useToast() {
  return useContext(ToastContext) ?? { show: () => {} };
}
