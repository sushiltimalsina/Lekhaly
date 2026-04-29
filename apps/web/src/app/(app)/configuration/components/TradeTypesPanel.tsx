"use client";

import * as React from "react";
import { Tag, ShoppingBag, ChevronDown, ChevronRight, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";

interface TradeTypesPanelProps {
  saleTypes: any[];
  purchaseTypes: any[];
  loading: boolean;
  busy: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAddSaleType: () => void;
  onEditSaleType: (st: any) => void;
  onRemoveSaleType: (id: string) => void;
  onAddPurchaseType: () => void;
  onEditPurchaseType: (pt: any) => void;
  onRemovePurchaseType: (id: string) => void;
  focus?: boolean;
}

export function TradeTypesPanel({
  saleTypes,
  purchaseTypes,
  loading,
  busy,
  expanded,
  onToggle,
  onAddSaleType,
  onEditSaleType,
  onRemoveSaleType,
  onAddPurchaseType,
  onEditPurchaseType,
  onRemovePurchaseType,
  focus,
}: TradeTypesPanelProps) {
  const [qSale, setQSale] = React.useState("");
  const [qPurchase, setQPurchase] = React.useState("");
  
  const filteredSales = saleTypes.filter(st => st.name.toLowerCase().includes(qSale.toLowerCase()));
  const filteredPurchases = purchaseTypes.filter(pt => pt.name.toLowerCase().includes(qPurchase.toLowerCase()));

  return (
    <Card className={cn("glass-card overflow-hidden", focus && "ring-2 ring-indigo-500/50")}>
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
              <Tag className="h-5 w-5 text-indigo-500" />
              Trade Types
            </CardTitle>
            <CardDescription>Manage available sales and purchase categories</CardDescription>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Sales Types Section */}
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center dark:bg-emerald-900/30">
                    <Tag className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-sm">Sales Types</h3>
                </div>
                <Button size="sm" onClick={onAddSaleType} className="h-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sales types..."
                  value={qSale}
                  onChange={e => setQSale(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filteredSales.length ? (
                  filteredSales.map(st => (
                    <div key={st.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm transition-all hover:border-emerald-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-900/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{st.name}</span>
                        {!st.isActive && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditSaleType(st)}
                          disabled={busy}
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveSaleType(st.id)}
                          disabled={busy}
                          className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {qSale ? "No matching sales types." : "No sales types added."}
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Types Section */}
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-orange-100 flex items-center justify-center dark:bg-orange-900/30">
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-sm">Purchase Types</h3>
                </div>
                <Button size="sm" onClick={onAddPurchaseType} className="h-8 rounded-xl bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search purchase types..."
                  value={qPurchase}
                  onChange={e => setQPurchase(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filteredPurchases.length ? (
                  filteredPurchases.map(pt => (
                    <div key={pt.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm transition-all hover:border-orange-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-orange-900/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{pt.name}</span>
                        {!pt.isActive && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditPurchaseType(pt)}
                          disabled={busy}
                          className="h-7 w-7 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemovePurchaseType(pt.id)}
                          disabled={busy}
                          className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {qPurchase ? "No matching purchase types." : "No purchase types added."}
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      )}
    </Card>
  );
}
