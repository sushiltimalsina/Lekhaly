import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type ToastItem = { id: string; type: ToastType; message: string; action?: { label: string; onClick: () => void }; duration?: number };

const listeners = new Set<(t: ToastItem) => void>();
const makeId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const emit = (item: ToastItem) => listeners.forEach((fn) => fn(item));

export const toast = {
  success: (msg: string, opts?: Partial<ToastItem>) => emit({ id: makeId(), type: "success", message: msg, ...opts }),
  error: (msg: string, opts?: Partial<ToastItem>) => emit({ id: makeId(), type: "error", message: msg, duration: 8000, ...opts }),
  warning: (msg: string, opts?: Partial<ToastItem>) => emit({ id: makeId(), type: "warning", message: msg, ...opts }),
  info: (msg: string, opts?: Partial<ToastItem>) => emit({ id: makeId(), type: "info", message: msg, ...opts }),
};

const ICONS: Record<ToastType, React.ElementType> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const STYLES: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100",
  error: "border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100",
  warning: "border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-100",
  info: "border-blue-200 bg-blue-50/95 text-blue-900 dark:border-blue-800 dark:bg-blue-950/90 dark:text-blue-100",
};
const ICON_CLR: Record<ToastType, string> = {
  success: "text-emerald-600 dark:text-emerald-400", error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400", info: "text-blue-600 dark:text-blue-400",
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = ICONS[item.type];
  const dismiss = React.useCallback(() => { setExiting(true); setTimeout(() => onDismiss(item.id), 300); }, [item.id, onDismiss]);

  React.useEffect(() => { timer.current = setTimeout(dismiss, item.duration ?? 5000); return () => { if (timer.current) clearTimeout(timer.current); }; }, [dismiss, item.duration]);

  return (
    <div role="alert" className={cn("group pointer-events-auto flex w-[380px] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-sm transition-all duration-300", STYLES[item.type], exiting ? "translate-x-[120%] opacity-0" : "translate-x-0 opacity-100")}
      onMouseEnter={() => { if (timer.current) clearTimeout(timer.current); }}
      onMouseLeave={() => { timer.current = setTimeout(dismiss, 2000); }}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_CLR[item.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{item.message}</p>
        {item.action && <button type="button" onClick={() => { item.action!.onClick(); dismiss(); }} className="mt-1.5 text-xs font-bold underline underline-offset-2 opacity-80 hover:opacity-100">{item.action.label}</button>}
      </div>
      <button type="button" onClick={dismiss} className="shrink-0 rounded-lg p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity" aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  React.useEffect(() => { const h = (t: ToastItem) => setToasts((p) => [...p.slice(-4), t]); listeners.add(h); return () => { listeners.delete(h); }; }, []);
  const dismiss = React.useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none" aria-live="polite">
      {toasts.map((item) => <ToastCard key={item.id} item={item} onDismiss={dismiss} />)}
    </div>, document.body
  );
}
