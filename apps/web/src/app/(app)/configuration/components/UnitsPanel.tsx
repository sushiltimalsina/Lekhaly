"use client";

import * as React from "react";
import { Ruler, ChevronDown, ChevronRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { SortableList } from "@/components/app/sortable-list";
import type { UnitRecord } from "@/lib/api/units";

interface UnitsPanelProps {
  units: UnitRecord[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (unit: UnitRecord) => void;
  onRemove: (id: string) => void;
  onReorder?: (units: UnitRecord[]) => void;
  focus?: boolean;
  forwardedRef?: React.RefObject<HTMLDivElement | null>;
}

export function UnitsPanel({
  units,
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
}: UnitsPanelProps) {
  const [q, setQ] = React.useState("");
  const filtered = units.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card ref={forwardedRef} className={cn("glass-card overflow-hidden", focus && "ring-2 ring-blue-500/50")}>
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
              <Ruler className="h-5 w-5 text-blue-500" />
              Units
            </CardTitle>
            <CardDescription>Measurement units for items</CardDescription>
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
              placeholder="Search units..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9 rounded-xl border-border"
            />
          </div>
          <div className="grid gap-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading units...</div>
            ) : filtered.length ? (
              <SortableList
                items={filtered}
                getId={(u) => u.id}
                onReorder={(newItems) => onReorder?.(newItems)}
                renderItem={(u) => (
                  <div className="flex w-full items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40 text-foreground">
                    <span className="font-medium">{u.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(u)}
                        disabled={busy}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(u.id)}
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
                {q ? `No units matching "${q}"` : "No units added yet."}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
