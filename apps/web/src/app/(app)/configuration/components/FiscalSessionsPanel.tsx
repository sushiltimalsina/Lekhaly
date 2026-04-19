"use client";

import * as React from "react";
import { Calendar, ChevronDown, ChevronRight, Plus, CheckCircle2, Lock, Unlock } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import type { FiscalSessionRecord } from "@/lib/api/fiscal-sessions";

interface FiscalSessionsPanelProps {
  sessions: FiscalSessionRecord[];
  activeSessionId?: string;
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onSwitch: (id: string) => void;
  onToggleLock: (id: string, lock: boolean) => void;
}

export function FiscalSessionsPanel({
  sessions,
  activeSessionId,
  loading,
  busy,
  expanded,
  onToggle,
  onAdd,
  onSwitch,
  onToggleLock
}: FiscalSessionsPanelProps) {
  return (
    <Card className={cn("glass-card overflow-hidden")}>
      <CardHeader 
        onClick={onToggle}
        className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expanded ? "pb-2" : "pb-4")}
      >
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
             {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
           </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Financial Years
            </CardTitle>
            <CardDescription>Manage accounting periods and active sessions</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onAdd(); }} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> New Year
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid gap-3">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading sessions...</div>
            ) : sessions.length ? (
              sessions.map(s => {
                const isActive = s.id === activeSessionId;
                const startDate = new Date(s.startDate).toLocaleDateString();
                const endDate = new Date(s.endDate).toLocaleDateString();

                return (
                  <div key={s.id} className={cn(
                    "group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border p-4 text-sm transition-all bg-muted/20 hover:bg-muted/40",
                    isActive && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                  )}>
                    <div className="flex flex-col gap-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{s.name}</span>
                        {isActive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                        {s.isLocked && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-red-500/10 text-red-600 border-red-500/20">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{startDate}</span>
                        <span>→</span>
                        <span>{endDate}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mt-1">
                        Prefix: {s.invoicePrefix} | {s.invoiceSuffix || 'No Suffix'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isActive && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="rounded-xl px-4"
                            disabled={busy}
                            onClick={() => onSwitch(s.id)}
                          >
                            Switch to this Year
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleLock(s.id, !s.isLocked)}
                          disabled={busy}
                          className={cn(
                            "h-9 w-9 rounded-xl transition-colors",
                            s.isLocked ? "text-red-500 hover:bg-red-50" : "text-muted-foreground hover:bg-accent"
                          )}
                          title={s.isLocked ? "Unlock Period" : "Lock Period"}
                        >
                          {s.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                No financial years defined.
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
