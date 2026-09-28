import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import { Button, Input } from "@lekhaly/ui";
import type { DualCalendarDate } from "@/lib/dates/fiscal-year";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";

type CreateNextFiscalYearInput = {
  name: string;
  startDate: string;
  endDate: string;
  lockCurrent: boolean;
};

type CreateNextFiscalYearDialogProps = {
  open: boolean;
  sessionId?: string;
  startDate?: DualCalendarDate;
  endDate?: DualCalendarDate;
  onClose: () => void;
  onSubmit: (input: CreateNextFiscalYearInput) => Promise<void>;
};

export default function CreateNextFiscalYearDialog({
  open,
  sessionId,
  startDate,
  endDate,
  onClose,
  onSubmit,
}: CreateNextFiscalYearDialogProps) {
  const [name, setName] = React.useState("");
  const [lockCurrent, setLockCurrent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { dateFormat } = useDateFormat();

  const renderedDates = React.useMemo(() => {
    const startDisplay = startDate ? getDateDisplay({ ad: startDate.ad, bs: startDate.bs, format: dateFormat }) : null;
    const endDisplay = endDate ? getDateDisplay({ ad: endDate.ad, bs: endDate.bs, format: dateFormat }) : null;
    return [
      { label: "Start date", primary: startDisplay?.primary ?? "--", secondary: startDisplay?.secondary ?? "" },
      { label: "End date", primary: endDisplay?.primary ?? "--", secondary: endDisplay?.secondary ?? "" },
    ];
  }, [dateFormat, startDate, endDate]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setName("");
      setLockCurrent(false);
      setError(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open, sessionId]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId || !name.trim() || !startDate?.ad || !endDate?.ad) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        startDate: new Date(`${startDate.ad}T12:00:00.000Z`).toISOString(),
        endDate: new Date(`${endDate.ad}T12:00:00.000Z`).toISOString(),
        lockCurrent,
      });
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to create the next fiscal year.");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-visible rounded-3xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between border-b border-border bg-accent/20 px-6 py-4 dark:bg-accent/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Create next fiscal year</h2>
              <p className="text-xs text-muted-foreground">Confirm the consecutive fiscal period</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={loading} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-foreground">
          {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <label className="block space-y-2 text-sm font-medium">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Fiscal Year Name</span>
            <Input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter fiscal year name"
              className="h-11 rounded-2xl border-border bg-accent/20 dark:bg-accent/10"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {renderedDates.map(({ label, primary, secondary }) => (
              <div key={label} className="min-w-0 space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
                <div className="min-h-11 min-w-0 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <div className="truncate font-mono text-sm font-semibold tabular-nums">{primary}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{secondary || "(" + (dateFormat === "bs" ? "AD" : "BS") + ")"}</div>
                </div>
              </div>
            ))}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
            <input
              type="checkbox"
              checked={lockCurrent}
              onChange={(event) => setLockCurrent(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-primary"
            />
            <span>
              <span className="block font-medium">Lock the previous fiscal year after creation</span>
              <span className="mt-1 block text-xs text-muted-foreground">Unchecked by default; the current year remains unlocked.</span>
            </span>
          </label>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="h-11 rounded-2xl px-6" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim() || !sessionId || !startDate?.ad || !endDate?.ad} className="h-11 min-w-[160px] rounded-2xl bg-emerald-600 px-8 text-emerald-50 hover:bg-emerald-700">
              {loading ? "Creating..." : "Create Fiscal Year"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
