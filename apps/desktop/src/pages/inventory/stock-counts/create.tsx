import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { ClipboardList, Save, AlertTriangle, CheckCircle2, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createStockCount } from "@/lib/api/stock-counts";
import { listItems } from "@/lib/api/items";
import { listWarehouses } from "@/lib/api/warehouses";

export default function CreateStockCountPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [reference, setReference] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [date, setDate] = React.useState({ ad: new Date().toISOString().slice(0, 10), bs: "" });
  const [memo, setMemo] = React.useState("");
  const [lines, setLines] = React.useState<any[]>([{ id: "1", itemId: "", binId: "", countedQty: "", note: "" }]);

  React.useEffect(() => {
    (async () => {
      try {
        const [iData, whData] = await Promise.all([listItems({ isActive: true, take: 5000 }), listWarehouses({ isActive: true })]);
        setItems(Array.isArray(iData) ? iData.filter((i: any) => i.type !== "services") : []);
        setWarehouses(Array.isArray(whData) ? whData : []);
      } catch {}
    })();
  }, []);

  const selectedWh = warehouses.find((w) => w.id === warehouseId);
  const whBins = selectedWh?.bins?.filter((b: any) => b.isActive) || [];

  const addLine = () => setLines([...lines, { id: Date.now().toString(), itemId: "", binId: "", countedQty: "", note: "" }]);
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));
  const updateLine = (id: string, field: string, value: any) => setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    const validLines = lines.filter((l) => l.itemId);
    if (validLines.length === 0) return setError("Add at least one item to count");
    if (!date.ad) return setError("Date is required");
    setSubmitting(true);
    try {
      await createStockCount({ reference: reference.trim() || undefined, warehouseId: warehouseId || undefined, countDate: date.ad, countDateBs: date.bs || undefined, memo: memo.trim() || undefined, lines: validLines.map((l) => ({ itemId: l.itemId, binId: l.binId || undefined, countedQty: l.countedQty ? Number(l.countedQty) : undefined, note: l.note || undefined })) });
      setSuccess("Stock count created!");
      setTimeout(() => navigate("/inventory/stock-counts"), 1500);
    } catch (e: any) { setError(e?.message ?? "Failed to create stock count"); setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Start Stock Count" description="Create a new physical inventory counting sheet." icon={ClipboardList} breadcrumb={<button onClick={() => navigate("/inventory/stock-counts")} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-3 w-3" /> Back to List</button>} />
        <Button onClick={handleSubmit} disabled={submitting} className="rounded-2xl h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-500/20"><Save className="mr-2 h-4 w-4" />{submitting ? "Saving…" : "Save Draft"}</Button>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> {success}</div>}

      <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Reference No.</label><Input placeholder="e.g. Q1 Count" value={reference} onChange={(e) => setReference(e.target.value)} className="rounded-xl h-11" /></div>
          <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Warehouse Scope</label><SearchableSelect options={[{ id: "", name: "All Warehouses" }, ...warehouses.map((w) => ({ id: w.id, name: w.name }))]} valueId={warehouseId} onChange={(id) => { setWarehouseId(id); setLines(lines.map((l) => ({ ...l, binId: "" }))); }} placeholder="Select Warehouse" /></div>
          <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Count Date</label><DualDateInput value={date} onChange={setDate} /></div>
        </div>
        <div><label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Memo</label><Input placeholder="Any special instructions..." value={memo} onChange={(e) => setMemo(e.target.value)} className="rounded-xl h-11" /></div>
      </CardContent></Card>

      <Card className="border-border/50 shadow-lg"><CardContent className="p-0">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/50"><tr><th className="px-4 py-3 font-bold w-[35%]">Item</th>{whBins.length > 0 && <th className="px-4 py-3 font-bold w-[20%]">Bin</th>}<th className="px-4 py-3 font-bold w-[20%]">Counted Qty</th><th className="px-4 py-3 font-bold">Notes</th><th className="px-4 py-3 w-10"></th></tr></thead><tbody className="divide-y divide-border/50">
          {lines.map((line) => (
            <tr key={line.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-2"><SearchableSelect options={items.map((i) => ({ id: i.id, name: `${i.name}${i.sku ? ` [${i.sku}]` : ""}` }))} valueId={line.itemId} onChange={(id) => updateLine(line.id, "itemId", id)} placeholder="Select item..." /></td>
              {whBins.length > 0 && <td className="p-2"><SearchableSelect options={[{ id: "", name: "Any" }, ...whBins.map((b: any) => ({ id: b.id, name: b.name }))]} valueId={line.binId} onChange={(id) => updateLine(line.id, "binId", id)} placeholder="Select bin..." /></td>}
              <td className="p-2"><Input type="number" placeholder="Empty to count later" value={line.countedQty} onChange={(e) => updateLine(line.id, "countedQty", e.target.value)} className="rounded-lg tabular-nums" /></td>
              <td className="p-2"><Input placeholder="Notes..." value={line.note} onChange={(e) => updateLine(line.id, "note", e.target.value)} className="rounded-lg" /></td>
              <td className="p-2 text-center"><button onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></td>
            </tr>
          ))}
        </tbody></table></div>
        <div className="p-4 border-t border-border/50 bg-muted/20"><Button variant="outline" size="sm" onClick={addLine} className="rounded-xl border-dashed hover:border-orange-500 hover:text-orange-600"><Plus className="mr-2 h-4 w-4" /> Add Item Row</Button></div>
      </CardContent></Card>
    </div>
  );
}
