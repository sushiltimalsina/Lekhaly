// apps/desktop/src/pages/inventory/adjust.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { MoneyText } from "@/components/app/money";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Package, ArrowUp, ArrowDown, Save, AlertTriangle, CheckCircle2, ChevronLeft, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasLineTracking, inventoryFeatures } from "@/lib/inventory-features";
import { adjustInventoryStock, getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listItems } from "@/lib/api/items";
import { listAccounts } from "@/lib/api/accounts";
import { listWarehouses, type Warehouse, type WarehouseBin } from "@/lib/api/warehouses";
import AddWarehouseDialog from "@/components/app/add-warehouse-dialog";

type DateValue = { ad: string; bs: string };

export default function StockAdjustPage() {
  const navigate = useNavigate();
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [addWarehouseOpen, setAddWarehouseOpen] = React.useState(false);
  const [addBinOpen, setAddBinOpen] = React.useState(false);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [itemId, setItemId] = React.useState("");
  const [direction, setDirection] = React.useState<"increase" | "decrease">("increase");
  const [qty, setQty] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [date, setDate] = React.useState<DateValue>({ ad: new Date().toISOString().slice(0, 10), bs: "" });
  const [memo, setMemo] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [binId, setBinId] = React.useState("");
  const [batchNo, setBatchNo] = React.useState("");
  const [lotNo, setLotNo] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [serialText, setSerialText] = React.useState("");
  const [allowNegative, setAllowNegative] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const [iData, aData, settingsData, whData] = await Promise.all([listItems({ isActive: true, take: 1000 }), listAccounts({ isActive: true, take: 1000 }), getInventorySettings(), listWarehouses({ isActive: true })]);
        setInventorySettings(settingsData);
        const whList = Array.isArray(whData) ? whData : [];
        setWarehouses(whList);
        if (settingsData.defaultWarehouseId) setWarehouseId(settingsData.defaultWarehouseId);
        const itemList = Array.isArray(iData) ? iData : (iData as any)?.items ?? [];
        const accountList = Array.isArray(aData) ? aData : (aData as any)?.accounts ?? (aData as any)?.items ?? [];
        setItems(itemList.filter((i: any) => i.type !== "services" && i.trackInventory !== false).map((i: any) => ({ id: i.id, name: i.name, sku: i.sku, stock: i.stock ?? 0, isSerialized: i.isSerialized, tracksBatch: i.tracksBatch, tracksLot: i.tracksLot, tracksExpiry: i.tracksExpiry, defaultWarehouseId: i.defaultWarehouseId, defaultBinId: i.defaultBinId, defaultBatchNo: i.defaultBatchNo, defaultLotNo: i.defaultLotNo, defaultExpiryDate: i.defaultExpiryDate, defaultExpiryDateBs: i.defaultExpiryDateBs })));
        setAccounts(accountList.filter((a: any) => a.isPostable !== false).map((a: any) => ({ id: a.id, name: a.name, code: a.code, type: a.type })));
      } catch (error: any) {
        setError(error?.message ?? "Failed to load items and accounts.");
      }
    })();
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => dateInputRef.current?.focus({ preventScroll: true }), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const availableBins = selectedWarehouse?.bins ?? [];
  const addWarehouseRecord = (warehouse: Warehouse) => {
    setWarehouses((prev) => [...prev.filter((row) => row.id !== warehouse.id), { ...warehouse, bins: warehouse.bins ?? [] }]);
    setWarehouseId(warehouse.id);
    setBinId("");
  };
  const addBinRecord = (bin: WarehouseBin) => {
    setWarehouses((prev) => prev.map((warehouse) => warehouse.id === bin.warehouseId ? { ...warehouse, bins: [...(warehouse.bins ?? []).filter((row) => row.id !== bin.id), bin] } : warehouse));
    setBinId(bin.id);
  };
  const features = inventoryFeatures(inventorySettings);
  const showTrackingCard = hasLineTracking(features) && (features.warehouses || features.batch || features.lot || features.expiry || (features.serial && selectedItem?.isSerialized));
  const amount = Number(qty) && Number(rate) ? Math.abs(Number(qty)) * Number(rate) : 0;

  React.useEffect(() => {
    if (!selectedItem) return;
    setWarehouseId(selectedItem.defaultWarehouseId || inventorySettings?.defaultWarehouseId || "");
    setBinId(selectedItem.defaultBinId || "");
    setBatchNo(selectedItem.defaultBatchNo || "");
    setLotNo(selectedItem.defaultLotNo || "");
    setExpiryDate(selectedItem.defaultExpiryDate ? String(selectedItem.defaultExpiryDate).split("T")[0] : "");
  }, [selectedItem?.id]);
  const projectedStock = (selectedItem?.stock ?? 0) + (direction === "increase" ? Math.abs(Number(qty) || 0) : -Math.abs(Number(qty) || 0));

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    if (!itemId) return setError("Select an item");
    if (!qty || Number(qty) === 0) return setError("Enter a quantity");
    if (direction === "increase" && (!rate || Number(rate) <= 0)) return setError("Enter a positive rate for stock increases");
    if (!date.ad) return setError("Select a date");
    if (features.requireWarehouse && !warehouseId) return setError("Select a warehouse");
    if (features.batch && selectedItem?.tracksBatch && !batchNo.trim()) return setError("Batch number is required for this item");
    if (features.lot && selectedItem?.tracksLot && !lotNo.trim()) return setError("Lot number is required for this item");
    if (features.expiry && selectedItem?.tracksExpiry && !expiryDate) return setError("Expiry date is required for this item");
    if (allowNegative && !overrideReason.trim()) return setError("Override reason is required");
    const finalQty = direction === "increase" ? Math.abs(Number(qty)) : -Math.abs(Number(qty));
    setSubmitting(true);
    try {
      const serialNumbers = serialText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean);
      const result = await adjustInventoryStock({ itemId, qty: finalQty, rate: rate ? Number(rate) : undefined, accountId: accountId || undefined, warehouseId: features.warehouses ? warehouseId || undefined : undefined, binId: features.bins ? binId || undefined : undefined, date: date.ad, dateBs: date.bs || undefined, memo: memo.trim() || undefined, batchNo: features.batch ? batchNo.trim() || undefined : undefined, lotNo: features.lot ? lotNo.trim() || undefined : undefined, expiryDate: features.expiry ? expiryDate || undefined : undefined, serialNumbers: features.serial && serialNumbers.length ? serialNumbers : undefined, allowNegativeOverride: features.negativeStock && allowNegative ? true : undefined, overrideReason: features.negativeStock && allowNegative ? overrideReason.trim() : undefined });
      setSuccess(result.approvalRequired ? `Stock adjustment sent for approval (${result.approvalId}).` : "Stock adjustment posted!");
      setTimeout(() => { setItemId(""); setQty(""); setRate(""); setMemo(""); setBatchNo(""); setLotNo(""); setExpiryDate(""); setSerialText(""); setAllowNegative(false); setOverrideReason(""); setSuccess(null); }, 2000);
    } catch (e: any) { setError(e?.message ?? "Failed"); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-4xl mx-auto animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/inventory")}
          className="mb-2 inline-flex items-center gap-2 rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-orange-600 hover:bg-orange-600 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Inventory
        </button>
        <PageHeader title="Stock Adjustment" description="Increase or decrease stock quantities with journal entry generation." icon={Package} />
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> {success}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adjustment Date</h3>
            <DualDateInput ref={dateInputRef} value={date} onChange={setDate} required />
          </CardContent></Card>

          <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Item</h3>
            <SearchableSelect options={items.map((i) => ({ value: i.id, label: `${i.name}${i.sku ? ` [${i.sku}]` : ""}` }))} value={itemId} onChange={setItemId} placeholder="Search items..." />
            {selectedItem && <div className="flex items-center gap-4 text-sm"><span className="text-muted-foreground">Current stock:</span><span className={cn("font-bold tabular-nums", (selectedItem.stock ?? 0) <= 0 ? "text-red-600" : "text-emerald-600")}>{selectedItem.stock ?? 0} units</span></div>}
          </CardContent></Card>

          <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adjustment Details</h3>
            <div className="flex gap-2">
              <button onClick={() => setDirection("increase")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 text-sm font-bold transition-all border-2", direction === "increase" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg" : "bg-transparent text-muted-foreground border-border")}><ArrowUp className="h-4 w-4" /> Increase</button>
              <button onClick={() => setDirection("decrease")} className={cn("flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 text-sm font-bold transition-all border-2", direction === "decrease" ? "bg-red-600 text-white border-red-600 shadow-lg" : "bg-transparent text-muted-foreground border-border")}><ArrowDown className="h-4 w-4" /> Decrease</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity *</label><Input type="number" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl h-12 text-lg font-bold tabular-nums" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">{direction === "increase" ? "Rate per unit *" : "Rate per unit"}</label><Input type="number" placeholder={direction === "increase" ? "0.00" : "Costed from inventory layers"} value={rate} onChange={(e) => setRate(e.target.value)} className="rounded-xl h-12 tabular-nums" disabled={direction === "decrease"} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Adjustment Account</label>
              <SearchableSelect options={accounts.map((a) => ({ value: a.id, label: `${a.code ? `${a.code} - ` : ""}${a.name}` }))} value={accountId} onChange={setAccountId} placeholder={direction === "increase" ? "Select stock gain / adjustment offset..." : "Select shrinkage / stock loss expense..."} />
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                {direction === "increase"
                  ? "Optional. If blank, the system uses or creates Stock Adjustment Gain."
                  : "Optional. If blank, the system uses or creates Inventory Shrinkage / Stock Adjustment Loss."}
              </p>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo</label><Input placeholder="Reason for adjustment" value={memo} onChange={(e) => setMemo(e.target.value)} className="rounded-xl" /></div>
          </CardContent></Card>

          {showTrackingCard && (
          <Card className="border-border/50 shadow-lg"><CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking</h3>
            {features.warehouses && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground"><span>Warehouse</span><button type="button" onClick={() => setAddWarehouseOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-700"><Plus className="h-3 w-3" /> Add</button></label><SearchableSelect options={warehouses.map((w) => ({ value: w.id, label: w.name }))} value={warehouseId} onChange={(v) => { setWarehouseId(v); setBinId(""); }} placeholder="Select warehouse..." /></div>
                {features.bins && <div><label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground"><span>Bin</span><button type="button" disabled={!warehouseId} onClick={() => setAddBinOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-700 disabled:opacity-50"><Plus className="h-3 w-3" /> Add</button></label><SearchableSelect options={availableBins.map((b) => ({ value: b.id, label: b.name }))} value={binId} onChange={setBinId} placeholder="Select bin..." /></div>}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              {features.batch && <Input placeholder={selectedItem?.tracksBatch ? "Batch Number *" : "Batch Number"} value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="rounded-xl" />}
              {features.lot && <Input placeholder={selectedItem?.tracksLot ? "Lot Number *" : "Lot Number"} value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rounded-xl" />}
              {features.expiry && <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-xl" />}
            </div>
            {selectedItem?.isSerialized && features.serial && <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial Numbers *</label><textarea value={serialText} onChange={(e) => setSerialText(e.target.value)} placeholder="One serial per line, or comma separated" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" /></div>}
          </CardContent></Card>
          )}

          {direction === "decrease" && features.negativeStock && (
            <Card className="border-amber-200 dark:border-amber-800/50 shadow-lg"><CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3"><input type="checkbox" id="allowNeg" checked={allowNegative} onChange={(e) => setAllowNegative(e.target.checked)} className="h-4 w-4 rounded" /><label htmlFor="allowNeg" className="text-sm font-medium">Allow negative stock override</label></div>
              {allowNegative && <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Override Reason *</label><Input placeholder="Why?" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="rounded-xl" /></div>}
            </CardContent></Card>
          )}
        </div>

        <div><Card className="border-border/50 shadow-xl sticky top-6"><CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Item</span><span className="font-medium truncate max-w-[60%] text-right">{selectedItem?.name || "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Direction</span><span className={cn("font-bold", direction === "increase" ? "text-emerald-600" : "text-red-600")}>{direction === "increase" ? "▲ Increase" : "▼ Decrease"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Qty</span><span className="font-bold tabular-nums">{qty || "0"}</span></div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm"><span className="font-bold">Total</span><MoneyText value={amount} className="text-lg font-black" /></div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs">
              <div className="mb-2 font-bold uppercase tracking-widest text-muted-foreground">Accounting Entry</div>
              {direction === "increase" ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-3"><span>Dr Inventory Asset</span><MoneyText value={amount} /></div>
                  <div className="flex justify-between gap-3"><span>Cr {selectedAccount?.name || "Stock Adjustment Gain"}</span><MoneyText value={amount} /></div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-3"><span>Dr {selectedAccount?.name || "Inventory Shrinkage / Stock Adjustment Loss"}</span><span>System cost</span></div>
                  <div className="flex justify-between gap-3"><span>Cr Inventory Asset</span><span>System cost</span></div>
                </div>
              )}
            </div>
            {selectedItem && <><div className="h-px bg-border" /><div className="flex justify-between text-sm"><span className="text-muted-foreground">Projected</span><span className={cn("font-black tabular-nums", projectedStock < 0 ? "text-red-600" : "text-emerald-600")}>{projectedStock}</span></div></>}
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !itemId || !qty} className={cn("w-full rounded-2xl h-12 font-bold shadow-lg text-white border-none", direction === "increase" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
            <Save className="mr-2 h-4 w-4" />{submitting ? "Posting…" : "Post Adjustment"}
          </Button>
        </CardContent></Card></div>
      </div>
      <AddWarehouseDialog open={addWarehouseOpen} onClose={() => setAddWarehouseOpen(false)} onSuccess={(warehouse) => addWarehouseRecord(warehouse as Warehouse)} />
      <AddWarehouseDialog open={addBinOpen} onClose={() => setAddBinOpen(false)} warehouseId={warehouseId || undefined} warehouseName={selectedWarehouse?.name} onSuccess={(bin) => addBinRecord(bin as WarehouseBin)} />
    </div>
  );
}

