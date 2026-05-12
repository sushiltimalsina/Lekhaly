import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import SearchableSelect from "@/components/app/searchable-select";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { ClipboardList, Save, AlertTriangle, CheckCircle2, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStockCount, updateStockCount, completeStockCount, type StockCount } from "@/lib/api/stock-counts";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { listAccounts } from "@/lib/api/accounts";

export default function ViewStockCountPage() {
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const [count, setCount] = React.useState<StockCount | null>(null);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [lineQtys, setLineQtys] = React.useState<Record<string, string>>({});
  const [adjustmentAccountId, setAdjustmentAccountId] = React.useState("");
  const [accounts, setAccounts] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        getStockCount(id),
        getInventorySettings().catch(() => null),
      ]);
      setCount(data);
      setInventorySettings(settings);
      const qtys: Record<string, string> = {};
      data.lines.forEach((l) => { if (l.countedQty !== null && l.countedQty !== undefined) qtys[l.id] = l.countedQty.toString(); });
      setLineQtys(qtys);
    } catch (e: any) { setError(e?.message ?? "Failed to load stock count"); } finally { setLoading(false); }
  }, [id]);

  React.useEffect(() => {
    load();
    (async () => { try { const accs = await listAccounts({ isActive: true }); setAccounts(Array.isArray(accs) ? accs.filter((a: any) => a.isPostable !== false) : []); } catch {} })();
  }, [load]);

  const handleUpdate = async () => {
    if (!count) return;
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      await updateStockCount(count.id, { status: count.status === "draft" ? "in_progress" : undefined, lines: count.lines.map((l) => ({ id: l.id, itemId: l.itemId, countedQty: lineQtys[l.id] !== undefined && lineQtys[l.id] !== "" ? Number(lineQtys[l.id]) : undefined })) });
      setSuccess("Quantities updated");
      await load(); setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) { setError(e?.message ?? "Failed to update"); } finally { setSubmitting(false); }
  };

  const handleComplete = async () => {
    if (!count) return;
    setError(null);
    if (count.lines.some((l) => lineQtys[l.id] === undefined || lineQtys[l.id] === "")) return setError("All lines must have a counted quantity.");
    if (!adjustmentAccountId) return setError("Please select an adjustment account.");
    if (!window.confirm("Are you sure you want to complete this count? This will post variances to the ledger.")) return;
    setSubmitting(true);
    try {
      await updateStockCount(count.id, { lines: count.lines.map((l) => ({ id: l.id, itemId: l.itemId, countedQty: Number(lineQtys[l.id]) })) });
      await completeStockCount(count.id, adjustmentAccountId);
      setSuccess("Stock count completed!");
      await load();
    } catch (e: any) { setError(e?.message ?? "Failed to complete stock count"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>;
  if (!count) return null;

  const isReadOnly = count.status === "completed" || count.status === "cancelled";
  const features = inventoryFeatures(inventorySettings);

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={count.reference || "Untitled Stock Count"} description={`Created on ${new Date(count.countDate).toLocaleDateString()}`} icon={ClipboardList} breadcrumb={<button onClick={() => navigate("/inventory/stock-counts")} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-3 w-3" /> Back to List</button>} />
        <div className="flex items-center gap-3">
          <span className={cn("text-[10px] uppercase font-bold px-3 py-1 rounded-full border", count.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : count.status === "in_progress" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200")}>{count.status.replace("_", " ")}</span>
          {!isReadOnly && <Button onClick={handleUpdate} disabled={submitting} variant="outline" className="rounded-2xl h-10 px-6 font-bold"><Save className="mr-2 h-4 w-4" /> Save Progress</Button>}
        </div>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> {success}</div>}

      {inventorySettings && !features.inventory ? (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Enable Inventory Tracking in Configuration to use physical stock counts.
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3"><Card className="border-border/50 shadow-lg"><CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/50"><tr><th className="px-4 py-3 font-bold w-[30%]">Item</th><th className="px-4 py-3 font-bold text-center">System Qty</th><th className="px-4 py-3 font-bold text-center w-[150px]">Counted Qty</th><th className="px-4 py-3 font-bold text-center">Variance</th><th className="px-4 py-3 font-bold">Notes</th></tr></thead><tbody className="divide-y divide-border/50">
            {count.lines.map((line) => {
              const counted = lineQtys[line.id] !== undefined && lineQtys[line.id] !== "" ? Number(lineQtys[line.id]) : null;
              const variance = counted !== null ? counted - line.systemQty : null;
              return (
                <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4"><div className="font-bold">{line.item?.name}</div>{(line.item?.sku || line.bin?.name) && <div className="text-xs text-muted-foreground mt-0.5">{line.item?.sku} {line.item?.sku && line.bin?.name && "•"} {line.bin?.name && `Bin: ${line.bin.name}`}</div>}</td>
                  <td className="p-4 text-center font-medium text-slate-500">{line.systemQty}</td>
                  <td className="p-4">{isReadOnly ? <div className="text-center font-bold">{line.countedQty ?? "—"}</div> : <Input type="number" placeholder="Qty" value={lineQtys[line.id] || ""} onChange={(e) => setLineQtys({ ...lineQtys, [line.id]: e.target.value })} className="rounded-lg tabular-nums text-center font-bold" />}</td>
                  <td className="p-4 text-center">{variance !== null ? <span className={cn("font-bold px-2 py-1 rounded-md text-xs", variance > 0 ? "bg-emerald-100 text-emerald-700" : variance < 0 ? "bg-red-100 text-red-700" : "text-muted-foreground")}>{variance > 0 ? "+" : ""}{variance}</span> : "—"}</td>
                  <td className="p-4 text-muted-foreground text-xs">{line.note || "—"}</td>
                </tr>
              );
            })}
          </tbody></table></div>
        </CardContent></Card></div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Count Details</h3>
            <div className="space-y-3 text-sm">
              {features.warehouses && <div className="flex justify-between"><span className="text-muted-foreground">Warehouse</span><span className="font-medium text-right">{count.warehouse?.name || "All"}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Created By</span><span className="font-medium text-right">{count.createdByUser?.name || "—"}</span></div>
              {count.memo && <div className="pt-3 border-t"><span className="text-xs font-bold uppercase text-muted-foreground block mb-1">Memo</span><p className="text-muted-foreground">{count.memo}</p></div>}
            </div>
          </CardContent></Card>
          {!isReadOnly && <Card className="border-orange-200 dark:border-orange-800/50 shadow-xl"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Complete Count</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Completing finalizing quantities and automatically generate a Journal Voucher to adjust stock for variances.</p>
            <div><label className="text-xs font-bold text-muted-foreground mb-1.5 block">Adjustment Account *</label><SearchableSelect options={accounts.map((a) => ({ id: a.id, name: `${a.code ? `${a.code} — ` : ""}${a.name}` }))} valueId={adjustmentAccountId} onChange={(id) => setAdjustmentAccountId(id)} placeholder="e.g. Shrinkage" /></div>
            <Button onClick={handleComplete} disabled={submitting} className="w-full rounded-2xl h-12 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 mt-2"><Check className="mr-2 h-4 w-4" /> Finalize</Button>
          </CardContent></Card>}
          {isReadOnly && count.adjustmentVoucherId && <Card className="border-emerald-200 dark:border-emerald-800/50 shadow-xl bg-emerald-50/50 dark:bg-emerald-900/10"><CardContent className="pt-6">
            <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" /><div><h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Count Completed</h3><p className="text-xs text-emerald-600/80 mt-1 mb-3">Variances posted to ledger.</p></div></div>
          </CardContent></Card>}
        </div>
      </div>
      )}
    </div>
  );
}
