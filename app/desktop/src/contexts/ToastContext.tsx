import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type ToastKind = "ok" | "err";

type Toast = { id: string; kind: ToastKind; message: string };

type ToastContextValue = {
  showToast: (t: { kind: ToastKind; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve essere usato dentro ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  /** Handle timer browser (`number`); compatibile con `clearTimeout`. */
  const dismissTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const ref = dismissTimersRef;
    return () => {
      const map = ref.current;
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    (t: { kind: ToastKind; message: string }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...t }]);
      const ms = t.kind === "err" ? 6500 : 3200;
      const timer = window.setTimeout(() => {
        dismissTimersRef.current.delete(id);
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, ms);
      dismissTimersRef.current.set(id, timer);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed right-0 top-0 z-[500] flex max-h-[100dvh] flex-col items-end gap-2 overflow-y-auto p-3 sm:p-4"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === "err" ? "alert" : "status"}
              className={[
                "pointer-events-auto flex w-[min(100vw-1.5rem,20rem)] max-w-[min(100vw-1.5rem,20rem)] animate-toast-in items-center gap-2 rounded-xl border px-3 py-2.5 shadow-[0_16px_48px_rgb(0_0_0/0.5)] backdrop-blur-md motion-reduce:animate-none",
                t.kind === "err"
                  ? "border-amber-400/30 bg-[rgb(22_18_14)]/95 text-amber-50/95 ring-1 ring-amber-400/15"
                  : "border-border bg-surface-1/95 text-fg/95 ring-1 ring-white/[0.06]",
              ].join(" ")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span
                  className="flex h-[1lh] shrink-0 items-center text-sm leading-snug"
                  aria-hidden
                >
                  <span
                    className={[
                      "h-2 w-2 rounded-full",
                      t.kind === "err" ? "bg-amber-400/90" : "bg-accent",
                    ].join(" ")}
                  />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-snug">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className={[
                  "inline-flex shrink-0 items-center justify-center rounded-md p-1 transition-colors",
                  t.kind === "err"
                    ? "text-amber-200/70 hover:bg-white/10 hover:text-amber-50"
                    : "text-muted hover:bg-white/[0.06] hover:text-fg",
                ].join(" ")}
                aria-label="Chiudi notifica"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
