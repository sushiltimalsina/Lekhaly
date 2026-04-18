"use client";

import * as React from "react";
import { Calculator, ChevronDown, ChevronRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import type { BillSundryRecord } from "@/lib/api/bill-sundries";

interface SundriesPanelProps {
  sundries: BillSundryRecord[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (sundry: BillSundryRecord) => void;
  onRemove: (id: string) => void;
  focus?: boolean;
  forwardedRef?: React.RefObject<HTMLDivElement | null>;
}

export function SundriesPanel({
  sundries,
  loading,
  busy,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onRemove,
  focus,
  forwardedRef
}: SundriesPanelProps) {
  const [q, setQ] = React.useState("");
  const filtered = sundries.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  const systemNames = ["Discount", "Shipping & Handling", "Packaging Charges", "Insurance", "Round Off", "VAT"];

  return (
    <Card ref={forwardedRef} className={cn("glass-card overflow-hidden lg:col-span-2", focus && "ring-2 ring-indigo-500/50")}>
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
              <Calculator className="h-5 w-5 text-indigo-500" />
              Bill Sundries
            </CardTitle>
            <CardDescription>Predefined additional charges or discounts</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onAdd(); }} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add New
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
           <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bill sundries..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9 rounded-xl border-border"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {loading ? (
              <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">Loading sundries...</div>
            ) : filtered.length ? (
              filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4 transition-all hover:bg-muted/40 text-foreground">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl font-medium",
                      s.type === "add" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30" : "bg-red-100 text-red-600 dark:bg-red-950/30"
                    )}>
                      {s.type === "add" ? <Plus className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-semibold text-foreground truncate">
                        {s.name}
                        {systemNames.includes(s.name) && (
                           <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0">System</span>
                        )}
                      </div>
                      <div className="font-mono text-xs uppercase tracking-tight text-muted-foreground truncate">
                        {s.rate ? `${s.rate}%` : "Manual"} • {s.type} {s.account?.name ? `• ${s.account.name}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(s)}
                      disabled={busy}
                      className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!systemNames.includes(s.name) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(s.id)}
                        disabled={busy}
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                {q ? `No sundries matching "${q}"` : "No predefined sundries found."}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
