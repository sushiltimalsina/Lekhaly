import * as React from "react";
import { Calendar, CheckCircle2, ChevronDown, ChevronRight, Lock, Plus, Unlock } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/date-format";
import { adToBs } from "@/lib/dates/convert";
import type { FiscalSessionRecord } from "@/lib/api/fiscal-sessions";

type FiscalSessionsPanelProps = {
  sessions: FiscalSessionRecord[];
  activeSessionId?: string;
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onCreateNext: (id: string) => void;
  onSwitch: (id: string) => void;
  onToggleLock: (id: string, locked: boolean) => void;
};

function getSessionDateParts(value: string, format: "ad" | "bs") {
  const ad = value.slice(0, 10);
  let bs = "--";
  try {
    bs = adToBs(ad);
  } catch {
    // Preserve the session row if a legacy date cannot be converted.
  }

  return format === "bs"
    ? { primary: bs, primaryCalendar: "BS", secondary: ad, secondaryCalendar: "AD" }
    : { primary: ad, primaryCalendar: "AD", secondary: bs, secondaryCalendar: "BS" };
}

export default function FiscalSessionsPanel({
  sessions,
  activeSessionId,
  loading,
  busy,
  expanded,
  onToggle,
  onAdd,
  onCreateNext,
  onSwitch,
  onToggleLock,
}: FiscalSessionsPanelProps) {
  const { dateFormat } = useDateFormat();

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader
        onClick={onToggle}
        className={cn("flex cursor-pointer select-none flex-row items-center justify-between gap-4 hover:bg-accent/10 transition-colors", expanded ? "pb-2" : "pb-4")}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </div>
          <Calendar className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <CardTitle className="text-lg">Financial Years</CardTitle>
            <CardDescription>Manage accounting periods and active sessions</CardDescription>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onAdd(); }} disabled={busy} className="rounded-xl">
          <Plus className="mr-1 h-4 w-4" /> New Year
        </Button>
      </CardHeader>
      {expanded && <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No financial years defined.
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => {
              const active = session.id === activeSessionId;
              const start = getSessionDateParts(session.startDate, dateFormat);
              const end = getSessionDateParts(session.endDate, dateFormat);

              return (
                <div key={session.id} className={cn(
                  "group flex flex-col justify-between rounded-2xl border bg-muted/20 p-4 text-sm transition-all hover:bg-muted/40 sm:flex-row sm:items-center",
                  active && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                )}>
                  <div className="mb-3 flex min-w-0 flex-col gap-1 sm:mb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold">{session.name}</span>
                      {active && <span className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Active</span>}
                      {session.isLocked && <span className="flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600"><Lock className="h-3 w-3" /> Locked</span>}
                    </div>
                    <div className="grid max-w-sm grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                      <div className="min-w-0">
                        <div className="mono-numbers text-sm font-semibold text-foreground">{start.primary} <span className="text-[10px] font-semibold text-muted-foreground">{start.primaryCalendar}</span></div>
                        <div className="text-xs text-muted-foreground">({start.secondary} {start.secondaryCalendar})</div>
                      </div>
                      <span className="pt-0.5 text-xs text-muted-foreground">to</span>
                      <div className="min-w-0">
                        <div className="mono-numbers text-sm font-semibold text-foreground">{end.primary} <span className="text-[10px] font-semibold text-muted-foreground">{end.primaryCalendar}</span></div>
                        <div className="text-xs text-muted-foreground">({end.secondary} {end.secondaryCalendar})</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {active && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl px-4"
                        disabled={busy}
                        onClick={() => onCreateNext(session.id)}
                      >
                        Create Next Year
                      </Button>
                    )}
                    {!active && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl px-4"
                        disabled={busy || session.isLocked}
                        title={session.isLocked ? "This fiscal year is locked and cannot be activated." : "Switch to this year"}
                        onClick={() => !session.isLocked && onSwitch(session.id)}
                      >
                        {session.isLocked ? "Locked" : "Switch to this Year"}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={busy}
                      title={session.isLocked ? "Unlock fiscal year" : "Lock fiscal year"}
                      aria-label={session.isLocked ? `Unlock ${session.name}` : `Lock ${session.name}`}
                      className={cn("h-9 w-9 rounded-xl transition-colors", session.isLocked ? "text-red-500 hover:bg-red-50" : "text-muted-foreground hover:bg-accent")}
                      onClick={() => onToggleLock(session.id, !session.isLocked)}
                    >
                      {session.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>}
    </Card>
  );
}
