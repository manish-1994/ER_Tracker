import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info as InfoIcon, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  toast: (options: { message: string; type: ToastType; duration?: number }) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = ({ message, type, duration = 4000 }: { message: string; type: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) => showToast({ message, type: "success", duration });
  const error = (message: string, duration?: number) => showToast({ message, type: "error", duration });
  const warning = (message: string, duration?: number) => showToast({ message, type: "warning", duration });
  const info = (message: string, duration?: number) => showToast({ message, type: "info", duration });

  return (
    <ToastContext.Provider value={{ toast: showToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const styles = {
              success: {
                border: "border-[var(--success)]/30",
                shadow: "shadow-[0_0_15px_rgba(0,255,157,0.15)]",
                text: "text-[var(--success)]",
                bg: "bg-[var(--card-background)]/95",
                progress: "bg-[var(--success)]",
                icon: <CheckCircle className="w-5 h-5 text-[var(--success)] shrink-0" />
              },
              error: {
                border: "border-[var(--danger)]/30",
                shadow: "shadow-[0_0_15px_rgba(255,77,109,0.15)]",
                text: "text-[var(--danger)]",
                bg: "bg-[var(--card-background)]/95",
                progress: "bg-[var(--danger)]",
                icon: <XCircle className="w-5 h-5 text-[var(--danger)] shrink-0" />
              },
              warning: {
                border: "border-[var(--warning)]/30",
                shadow: "shadow-[0_0_15px_rgba(255,184,0,0.15)]",
                text: "text-[var(--warning)]",
                bg: "bg-[var(--card-background)]/95",
                progress: "bg-[var(--warning)]",
                icon: <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />
              },
              info: {
                border: "border-[var(--info)]/30",
                shadow: "shadow-[0_0_15px_rgba(0,229,255,0.15)]",
                text: "text-[var(--info)]",
                bg: "bg-[var(--card-background)]/95",
                progress: "bg-[var(--info)]",
                icon: <InfoIcon className="w-5 h-5 text-[var(--info)] shrink-0" />
              }
            }[t.type];

            return (
              <motion.div
                key={t.id}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`pointer-events-auto backdrop-blur-md border rounded-xl p-4 flex items-start gap-3 relative overflow-hidden select-none font-mono min-h-[64px] w-80 text-xs tracking-wider uppercase font-bold text-white ${styles.border} ${styles.shadow} ${styles.bg}`}
              >
                {/* Visual Corner Bracket Decoration for Cyberpunk Feel */}
                <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${t.type === 'success' ? 'border-[var(--success)]' : t.type === 'error' ? 'border-[var(--danger)]' : t.type === 'warning' ? 'border-[var(--warning)]' : 'border-[var(--info)]'}`} />
                <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${t.type === 'success' ? 'border-[var(--success)]' : t.type === 'error' ? 'border-[var(--danger)]' : t.type === 'warning' ? 'border-[var(--warning)]' : 'border-[var(--info)]'}`} />

                {styles.icon}
                <div className="flex-1 pr-4">
                  <div className={`font-black text-[10px] mb-0.5 tracking-widest ${styles.text}`}>
                    {t.type.toUpperCase()} SIGNAL
                  </div>
                  <div className="text-[11px] font-mono leading-relaxed text-theme normal-case">
                    {t.message}
                  </div>
                </div>

                <button
                  onClick={() => dismissToast(t.id)}
                  className="text-theme-muted hover:text-[var(--text)] transition shrink-0 self-start mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Animated progress bar */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: (t.duration ?? 4000) / 1000, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-[2px] ${styles.progress}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
