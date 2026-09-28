import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import { Button, Input, Switch } from "@lekhaly/ui";
import DualDateInput from "@/components/app/dual-date-input";
import { createFiscalSession, formatVoucherNumber } from "@/lib/api/fiscal-sessions";
import { getFiscalYearEndDate, type DualCalendarDate } from "@/lib/dates/fiscal-year";

interface AddFiscalSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFiscalSessionDialog({ open, onClose, onSuccess }: AddFiscalSessionDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [isCurrent, setIsCurrent] = React.useState(true);
  const [startDate, setStartDate] = React.useState<DualCalendarDate>({ ad: "", bs: "" });
  const [endDate, setEndDate] = React.useState<DualCalendarDate>({ ad: "", bs: "" });

  const suffix = startDate.bs && endDate.bs
    ? `${startDate.bs.slice(2, 4)}/${endDate.bs.slice(2, 4)}`
    : "";
  const example = suffix ? formatVoucherNumber("SI", 1, suffix) : "--";
  const datesValid = Boolean(startDate.ad && endDate.ad && startDate.ad <= endDate.ad);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setError(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!datesValid) return;
    setLoading(true);
    setError(null);
    try {
      const startYear = startDate.bs.slice(0, 4);
      const endYear = endDate.bs.slice(0, 4);
      await createFiscalSession({
        name: name.trim() || `Year ${startYear}/${endYear.slice(-2)}`,
        startDate: new Date(`${startDate.ad}T12:00:00.000Z`).toISOString(),
        endDate: new Date(`${endDate.ad}T12:00:00.000Z`).toISOString(),
        isCurrent,
        invoiceSuffix: suffix,
      });
      onSuccess();
      onClose();
      setName("");
      setIsCurrent(true);
      setStartDate({ ad: "", bs: "" });
      setEndDate({ ad: "", bs: "" });
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to create fiscal year");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-visible rounded-3xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200">
        <header className="flex items-center justify-between border-b border-border bg-accent/20 px-6 py-4 dark:bg-accent/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">New Financial Year</h2>
              <p className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">Set up accounting period</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X className="h-4 w-4" /></Button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-foreground">
          {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          <label className="block space-y-2 text-sm font-medium">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Session Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Year 2083/84" className="h-11 rounded-2xl border-border bg-accent/20 dark:bg-accent/10" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <DualDateInput label="Start Date" required value={startDate} onChange={(value) => {
              setStartDate(value);
              setEndDate(getFiscalYearEndDate(value.bs));
              if (!name && value.bs) {
                const end = getFiscalYearEndDate(value.bs);
                setName(`Year ${value.bs.slice(0, 4)}/${end.bs.slice(2, 4)}`);
              }
            }} popupZIndex={10010} />
            <DualDateInput label="End Date (calculated)" disabled value={endDate} onChange={() => {}} popupZIndex={10010} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Invoice number example</span>
            <span className="font-semibold tabular-nums">{example}</span>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4 text-sm">
            <span>Set as current active year</span>
            <Switch checked={isCurrent} onCheckedChange={setIsCurrent} />
          </label>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" className="h-11 rounded-2xl px-6 text-xs font-bold" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !datesValid} className="h-11 min-w-[140px] rounded-2xl bg-emerald-600 px-8 text-xs font-bold text-emerald-50 hover:bg-emerald-700">
              {loading ? "Creating..." : "Create Year"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
