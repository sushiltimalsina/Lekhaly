"use client";

import * as React from "react";
import { CreditCard, ChevronDown, ChevronRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { SortableList } from "@/components/app/sortable-list";

interface PaymentMethodsPanelProps {
  paymentMethods: any[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (pm: any) => void;
  onRemove: (id: string) => void;
  onReorder?: (items: any[]) => void;
  focus?: boolean;
  forwardedRef?: React.RefObject<HTMLDivElement | null>;
}

export function PaymentMethodsPanel({
  paymentMethods,
  loading,
  busy,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onRemove,
  onReorder,
  focus,
  forwardedRef
}: PaymentMethodsPanelProps) {
  const [q, setQ] = React.useState("");
  const filtered = paymentMethods.filter(pm => pm.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card ref={forwardedRef} className={cn("glass-card overflow-hidden", focus && "ring-2 ring-emerald-500/50")}>
      <CardHeader 
        onClick={onToggle}
        className={cn("flex flex-row items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors select-none", expanded ? "pb-2" : "pb-4")}
      >
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
             {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
           </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage available payment options</CardDescription>
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
              placeholder="Search payment methods..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9 rounded-xl border-border"
            />
          </div>
          <div className="grid gap-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length ? (
              <SortableList
                items={filtered}
                getId={(pm) => pm.id}
                onReorder={(newItems) => onReorder?.(newItems)}
                renderItem={(pm) => (
                  <div className="flex w-full items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40 text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-left">{pm.name}</span>
                      {!pm.isActive && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(pm)}
                        disabled={busy}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(pm.id)}
                        disabled={busy}
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                {q ? `No matching payment methods.` : "No payment methods added yet."}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
