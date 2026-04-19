"use client";

import * as React from "react";
import { Button, Input, Switch } from "@lekhaly/ui";
import { createFiscalSession } from "@/lib/api/fiscal-sessions";
import { createPortal } from "react-dom";
import { X, Calendar as CalendarIcon } from "lucide-react";

interface AddFiscalSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFiscalSessionDialog({
  open,
  onClose,
  onSuccess
}: AddFiscalSessionDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: true
  });

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createFiscalSession({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      onSuccess();
      onClose();
      setForm({ name: "", startDate: "", endDate: "", isCurrent: true });
    } catch (err: any) {
      setError(err.message || "Failed to create fiscal session");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4 border-border bg-accent/20 dark:bg-accent/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/30 font-medium">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                New Financial Year
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Set up accounting period</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-foreground">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Session Name</label>
            <Input 
              placeholder="e.g. FY 2024-25" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              required 
              className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Start Date</label>
              <Input 
                type="date" 
                value={form.startDate} 
                onChange={e => setForm({...form, startDate: e.target.value})} 
                required 
                className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">End Date</label>
              <Input 
                type="date" 
                value={form.endDate} 
                onChange={e => setForm({...form, endDate: e.target.value})} 
                required 
                className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border">
            <label htmlFor="isCurrent" className="text-sm font-medium leading-none cursor-pointer">
              Set as current active session
            </label>
            <Switch 
              checked={form.isCurrent} 
              onCheckedChange={(v: boolean) => setForm({...form, isCurrent: v})} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-2xl text-xs font-bold border border-border hover:bg-accent transition-all text-muted-foreground"
            >
              CANCEL
            </button>
            <button
                type="submit" 
                disabled={loading} 
                className="h-11 px-8 rounded-2xl text-xs font-bold bg-emerald-600 text-emerald-50 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center min-w-[140px]"
            >
              {loading ? "CREATING..." : "CREATE SESSION"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
