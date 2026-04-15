// apps/desktop/src/components/app/status-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";

export type DocStatus = "draft" | "posted" | "void" | "open" | "fulfilled" | "cancelled" | "sent" | "accepted" | "declined" | "expired";

type StatusBadgeProps = {
  status: DocStatus | string;
  className?: string;
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();

  const variants: Record<string, string> = {
    draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    posted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    fulfilled: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    void: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    sent: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    declined: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    expired: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };

  const style = variants[s] || "bg-muted text-muted-foreground border-border";

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      style,
      className
    )}>
      {status}
    </span>
  );
}
