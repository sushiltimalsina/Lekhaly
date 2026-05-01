import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Package, Plus, Hammer, Wrench, RefreshCw, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoneyText } from "@/components/app/money";
import { getStockReport, type StockReportRow } from "@/lib/api/inventory";
import { listItems, getItem, assembleItem, disassembleItem, type ItemRecord } from "@/lib/api/items";

export default function AssemblyOrdersPage() {
  const [kits, setKits] = React.useState<ItemRecord[]>([]);
  const [stock, setStock] = React.useState<StockReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [selectedKitId, setSelectedKitId] = React.useState("");
  const [selectedKitDetails, setSelectedKitDetails] = React.useState<ItemRecord | null>(null);
  
  const [mode, setMode] = React.useState<"assemble" | "disassemble">("assemble");
  const [targetQty, setTargetQty] = React.useState("1");
  const [memo, setMemo] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [allItems, stockReport] = await Promise.all([
        listItems({ take: 1000 }),
        getStockReport()
      ]);
      setKits(allItems.filter(i => Boolean(i.isKit)));
      setStock(stockReport);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    async function loadKitDetails() {
      if (!selectedKitId) {
        setSelectedKitDetails(null);
        return;
      }
      try {
        const details = await getItem(selectedKitId);
        setSelectedKitDetails(details);
      } catch (e: any) {
        console.error("Failed to load kit details", e);
        setSelectedKitDetails(null);
      }
    }
    loadKitDetails();
  }, [selectedKitId]);

  const qtyToBuild = Math.max(1, Number(targetQty) || 0);

  // Compute BOM details
  const bomRows = React.useMemo(() => {
    if (!selectedKitDetails?.components) return [];
    return selectedKitDetails.components.map(comp => {
      const requiredPerKit = Number(comp.qty);
      const totalRequired = requiredPerKit * qtyToBuild;
      
      const stockRow = stock.find(s => s.id === comp.componentId);
      const availableQty = Number(stockRow?.closingQty ?? 0);
      
      // Moving Average Cost
      let avgCost = 0;
      if (availableQty > 0) {
         avgCost = Number(stockRow?.closingAmt ?? 0) / availableQty;
      } else {
         // Fallback to purchase price if no stock
         const rawItem = stock.find(s => s.id === comp.componentId);
         avgCost = Number(rawItem?.purchaseAvgPrice ?? 0);
      }

      const projectedCost = totalRequired * avgCost;
      const isShort = mode === "assemble" && availableQty < totalRequired;

      return {
        ...comp,
        requiredPerKit,
        totalRequired,
        availableQty,
        avgCost,
        projectedCost,
        isShort
      };
    });
  }, [selectedKitDetails, qtyToBuild, stock, mode]);

  const totalProjectedCost = bomRows.reduce((sum, row) => sum + row.projectedCost, 0);
  const hasShortages = bomRows.some(row => row.isShort);

  const handleSubmit = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!selectedKitId) {
      setActionError("Please select a Kit.");
      return;
    }
    if (qtyToBuild <= 0) {
      setActionError("Quantity must be greater than zero.");
      return;
    }
    if (mode === "assemble" && hasShortages) {
      // We can still allow assembly if they allow negative stock, but let's strictly warn
      // For now, allow it but they have been warned by the UI.
    }

    setSubmitting(true);
    try {
      if (mode === "assemble") {
        await assembleItem(selectedKitId, qtyToBuild, memo || undefined);
        setActionSuccess(`Successfully assembled ${qtyToBuild} units of ${selectedKitDetails?.name}.`);
      } else {
        await disassembleItem(selectedKitId, qtyToBuild);
        setActionSuccess(`Successfully disassembled ${qtyToBuild} units of ${selectedKitDetails?.name}.`);
      }
      setSelectedKitId("");
      setTargetQty("1");
      setMemo("");
      await refresh();
    } catch (e: any) {
      setActionError(e?.message ?? `Failed to ${mode}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Assembly Orders"
          description="Build Finished Goods from components, or tear them down into raw materials."
          icon={Hammer}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="rounded-2xl h-12 px-5">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Setup */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-indigo-500" />
              Order Details
            </h2>

            <div className="space-y-4">
              <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setMode("assemble")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all",
                    mode === "assemble"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ▲ Assemble
                </button>
                <button
                  type="button"
                  onClick={() => setMode("disassemble")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all",
                    mode === "disassemble"
                      ? "bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-300"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ▼ Disassemble
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Kit</label>
                <select
                  value={selectedKitId}
                  onChange={(e) => setSelectedKitId(e.target.value)}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Choose a Finished Good --</option>
                  {kits.map(k => (
                    <option key={k.id} value={k.id}>{k.name} {k.sku ? `(${k.sku})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Quantity</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={targetQty}
                  onChange={(e) => setTargetQty(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="e.g. 50"
                />
              </div>

              {mode === "assemble" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assembly Memo (Optional)</label>
                  <Input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="e.g. Production Batch #892"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-lg dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-blue-950/20">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-1">
              {mode === "assemble" ? "Projected Cost" : "Projected Value Return"}
            </h3>
            <MoneyText value={totalProjectedCost} className="text-4xl font-black text-indigo-700 dark:text-indigo-400" />
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2">
              Based on the Moving Average Cost of required components.
            </p>
          </div>
        </div>

        {/* Right Col: BOM and Submit */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-0 shadow-xl overflow-hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-500" />
                Bill of Materials (BOM)
              </h2>
              {selectedKitDetails ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Components required to build <strong className="text-foreground">{qtyToBuild}x {selectedKitDetails.name}</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Select a Kit to view components.</p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-400">Component</th>
                    <th className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">Qty/Kit</th>
                    <th className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">Total Req</th>
                    <th className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">In Stock</th>
                    <th className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">Unit Cost</th>
                    <th className="p-4 text-right font-semibold text-slate-600 dark:text-slate-400">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bomRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No components defined for this Kit.
                      </td>
                    </tr>
                  ) : (
                    bomRows.map(row => (
                      <tr key={row.id} className={cn("transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50", row.isShort ? "bg-rose-50/30 dark:bg-rose-950/20" : "")}>
                        <td className="p-4">
                          <div className="font-medium">{row.component.name}</div>
                          {row.component.sku && <div className="text-xs text-muted-foreground">{row.component.sku}</div>}
                        </td>
                        <td className="p-4 text-right tabular-nums">{row.requiredPerKit} {row.component.unit || ""}</td>
                        <td className="p-4 text-right font-bold tabular-nums">{row.totalRequired} {row.component.unit || ""}</td>
                        <td className="p-4 text-right tabular-nums">
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            row.isShort
                              ? "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-900/20 dark:text-rose-400"
                              : "bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            {row.availableQty} {row.isShort && <AlertTriangle className="ml-1.5 h-3 w-3" />}
                          </span>
                        </td>
                        <td className="p-4 text-right tabular-nums text-muted-foreground">
                          <MoneyText value={row.avgCost} />
                        </td>
                        <td className="p-4 text-right font-medium tabular-nums">
                          <MoneyText value={row.projectedCost} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {hasShortages && mode === "assemble" && (
              <div className="bg-rose-50 border-t border-rose-100 p-4 flex items-start gap-3 dark:bg-rose-950/30 dark:border-rose-900/30">
                <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Insufficient Stock Warning</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                    You do not have enough components in inventory to complete this assembly. Continuing will push component stock into the negative.
                  </p>
                </div>
              </div>
            )}
          </div>

          {actionError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-700 flex items-center gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 shadow-sm flex items-center justify-between">
              <span>{actionSuccess}</span>
              <Button variant="outline" size="sm" onClick={() => setActionSuccess(null)} className="h-8 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20">
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !selectedKitId || qtyToBuild <= 0}
              className={cn(
                "rounded-2xl px-8 h-14 text-lg font-bold shadow-xl transition-all",
                mode === "assemble"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 text-white"
                  : "bg-slate-700 hover:bg-slate-800 shadow-slate-500/20 text-white"
              )}
            >
              {submitting ? "Processing..." : mode === "assemble" ? "Execute Assembly" : "Execute Disassembly"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
