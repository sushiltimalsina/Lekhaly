// apps/desktop/src/pages/inventory/transfer.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { MoneyText } from "@/components/app/money";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { ArrowRightLeft, Save, AlertTriangle, CheckCircle2, ChevronLeft, Info, ArrowRight, Warehouse, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { transferInventoryStock } from "@/lib/api/inventory";
import { listItems } from "@/lib/api/items";
import { listWarehouses, type Warehouse as WarehouseType } from "@/lib/api/warehouses";

type DateValue = { ad: string; bs: string };

export default function StockTransferPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseType[]>([]);
  const [itemId, setItemId] = React.useState("");
  const [fromWarehouseId, setFromWarehouseId] = React.useState("");
  const [fromBinId, setFromBinId] = React.useState("");
  const [toWarehouseId, setToWarehouseId] = React.useState("");
  const [toBinId, setToBinId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [date, setDate] = React.useState<DateValue>({ ad: new Date().toISOString().slice(0, 10), bs: "" });
  const [memo, setMemo] = React.useState("");
  const [batchNo, setBatchNo] = React.useState("");
  const [lotNo, setLotNo] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const [iData, whData] = await Promise.all([listItems({ isActive: true, take: 5000 }), listWarehouses({ isActive: true })]);
        setItems((Array.isArray(iData) ? iData : []).filter((i: any) => i.type !== "services").map((i: any) => ({ id: i.id, name: i.name, sku: i.sku, stock: i.stock ?? 0 })));
        setWarehouses(Array.isArray(whData) ? whData : []);
      } catch {}
    })();
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);
  const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
  const toWh = warehouses.find((w) => w.id === toWarehouseId);
  const fromBins = fromWh?.bins?.filter((b) => b.isActive) ?? [];
  const toBins = toWh?.bins?.filter((b) => b.isActive) ?? [];
  const amount = Number(qty) && Number(rate) ? Math.abs(Number(qty)) * Number(rate) : 0;

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    if (!itemId) return setError("Select an item");
    if (!fromWarehouseId) return setError("Select source warehouse");
    if (!toWarehouseId) return setError("Select destination warehouse");
    if (fromWarehouseId === toWarehouseId && fromBinId === toBinId) return setError("Source and destination cannot be the same");
    if (!qty || Number(qty) <= 0) return setError("Enter a positive quantity");
    if (!date.ad) return setError("Select a date");
    setSubmitting(true);
    try {
      await transferInventoryStock({ itemId, fromWarehouseId, fromBinId: fromBinId || undefined, toWarehouseId, toBinId: toBinId || undefined, qty: Number(qty), rate: rate ? Number(rate) : undefined, date: date.ad, dateBs: date.bs || undefined, memo: memo.trim() || undefined, batchNo: batchNo.trim() || undefined, lotNo: lotNo.trim() || undefined, expiryDate: expiryDate || undefined });
      setSuccess("Stock transfer completed!");
      setTimeout(() => { setItemId(""); setFromWarehouseId(""); setFromBinId(""); setToWarehouseId(""); setToBinId(""); setQty(""); setRate(""); setMemo(""); setBatchNo(""); setLotNo(""); setExpiryDate(""); setSuccess(null); }, 2000);
    } catch (e: any) { setError(e?.message ?? "Failed to transfer stock"); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-4xl mx-auto animate-fade-in">
      <div>
        <button onClick={() => navigate("/inventory")} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"><ChevronLeft className="h-3 w-3" /> Back to Inventory</button>
        <PageHeader title="Stock Transfer" description="Move inventory between warehouses and storage locations." icon={ArrowRightLeft} />
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> {success}</div>}

      {/* Item */}
      <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Item</h3>
        <SearchableSelect options={items.map((i) => ({ value: i.id, label: `${i.name}${i.sku ? ` (${i.sku})` : ""}` }))} value={itemId} onChange={setItemId} placeholder="Search items..." />
        {selectedItem && <div className="flex items-center gap-4 text-sm"><span className="text-muted-foreground">Total stock:</span><span className="font-bold tabular-nums">{selectedItem.stock ?? 0} units</span></div>}
      </CardContent></Card>

      {/* From → To */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2"><Warehouse className="h-3.5 w-3.5" /> Source (From)</h3>
          <SearchableSelect options={warehouses.map((w) => ({ value: w.id, label: `${w.name}${w.code ? ` (${w.code})` : ""}` }))} value={fromWarehouseId} onChange={(v) => { setFromWarehouseId(v); setFromBinId(""); }} placeholder="Select source warehouse" />
          {fromBins.length > 0 && <SearchableSelect options={[{ value: "", label: "No specific bin" }, ...fromBins.map((b) => ({ value: b.id, label: `${b.name}${b.code ? ` (${b.code})` : ""}` }))]} value={fromBinId} onChange={setFromBinId} placeholder="Select bin (optional)" />}
        </CardContent></Card>
        <div className="flex items-center justify-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600"><ArrowRight className="h-6 w-6" /></div></div>
        <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Warehouse className="h-3.5 w-3.5" /> Destination (To)</h3>
          <SearchableSelect options={warehouses.map((w) => ({ value: w.id, label: `${w.name}${w.code ? ` (${w.code})` : ""}` }))} value={toWarehouseId} onChange={(v) => { setToWarehouseId(v); setToBinId(""); }} placeholder="Select destination warehouse" />
          {toBins.length > 0 && <SearchableSelect options={[{ value: "", label: "No specific bin" }, ...toBins.map((b) => ({ value: b.id, label: `${b.name}${b.code ? ` (${b.code})` : ""}` }))]} value={toBinId} onChange={setToBinId} placeholder="Select bin (optional)" />}
        </CardContent></Card>
      </div>

      {/* Qty & Details */}
      <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transfer Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity *</label><Input type="number" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl h-12 text-lg font-bold tabular-nums" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rate per unit</label><Input type="number" placeholder="0.00" value={rate} onChange={(e) => setRate(e.target.value)} className="rounded-xl h-12 tabular-nums" /></div>
          <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Transfer Date *</label><DualDateInput value={date} onChange={setDate} /></div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo</label><Input placeholder="Reason for transfer" value={memo} onChange={(e) => setMemo(e.target.value)} className="rounded-xl" /></div>
      </CardContent></Card>

      {/* Batch/Lot */}
      <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Batch / Lot (Optional)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input placeholder="Batch No." value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="rounded-xl" />
          <Input placeholder="Lot No." value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rounded-xl" />
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-xl" />
        </div>
      </CardContent></Card>

      {/* Submit */}
      <Card className="border-blue-200 dark:border-blue-800/50 shadow-xl"><CardContent className="pt-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transfer Summary</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="text-center sm:text-left flex-1 min-w-0"><div className="text-xs text-muted-foreground">From</div><div className="font-bold truncate">{fromWh?.name || "—"}</div></div>
          <div className="flex items-center gap-2"><ArrowRight className="h-5 w-5 text-blue-500" /><div className="text-center"><div className="text-xs text-muted-foreground">Qty</div><div className="text-lg font-black tabular-nums">{qty || "0"}</div></div><ArrowRight className="h-5 w-5 text-blue-500" /></div>
          <div className="text-center sm:text-right flex-1 min-w-0"><div className="text-xs text-muted-foreground">To</div><div className="font-bold truncate">{toWh?.name || "—"}</div></div>
        </div>
        {amount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Transfer Value</span><MoneyText value={amount} className="font-bold" /></div>}
        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3 shrink-0" /> Stock will be deducted from source and added to destination.</p>
        <Button onClick={handleSubmit} disabled={submitting || !itemId || !fromWarehouseId || !toWarehouseId || !qty} className="w-full rounded-2xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20">
          <Save className="mr-2 h-4 w-4" />{submitting ? "Transferring…" : "Execute Transfer"}
        </Button>
      </CardContent></Card>
    </div>
  );
}
