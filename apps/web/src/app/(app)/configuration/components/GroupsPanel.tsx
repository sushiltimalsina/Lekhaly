"use client";

import * as React from "react";
import { Layers, ChevronDown, ChevronRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import type { ItemGroupRecord } from "@/lib/api/item-groups";

interface GroupsPanelProps {
  groups: ItemGroupRecord[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (group: ItemGroupRecord) => void;
  onRemove: (id: string) => void;
  focus?: boolean;
  forwardedRef?: React.RefObject<HTMLDivElement | null>;
}

export function GroupsPanel({
  groups,
  loading,
  busy,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onRemove,
  focus,
  forwardedRef
}: GroupsPanelProps) {
  const [q, setQ] = React.useState("");
  const filtered = groups.filter(g => g.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card ref={forwardedRef} className={cn("glass-card overflow-hidden", focus && "ring-2 ring-orange-500/50")}>
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
              <Layers className="h-5 w-5 text-orange-500" />
              Groups
            </CardTitle>
            <CardDescription>Item categorization groups</CardDescription>
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
              placeholder="Search groups..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9 rounded-xl border-border"
            />
          </div>
          <div className="grid gap-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading groups...</div>
            ) : filtered.length ? (
              filtered.map(g => (
                <div key={g.id} className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm transition-all hover:bg-muted/40 text-foreground">
                  <span className="font-medium">{g.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(g)}
                      disabled={busy}
                      className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(g.id)}
                      disabled={busy}
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
                {q ? `No groups matching "${q}"` : "No groups added yet."}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
