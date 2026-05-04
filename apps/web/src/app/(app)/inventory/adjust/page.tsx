"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { MoneyText } from "@/components/app/money";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import {
  Package,
  ArrowUp,
  ArrowDown,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adjustInventoryStock, getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listItems } from "@/lib/api/items";
import { listAccounts } from "@/lib/api/accounts";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";

type DateValue = { ad: string; bs: string };
type ItemOption = {
  id: string;
  name: string;
  sku?: string | null;
  stock?: number;
  isSerialized?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
};
type AccountOption = { id: string; name: string; code?: string };

export default function StockAdjustPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Items and accounts for pickers
  const [items, setItems] = React.useState<ItemOption[]>([]);
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);

  // Form state
  const [itemId, setItemId] = React.useState("");
  const [direction, setDirection] = React.useState<"increase" | "decrease">("increase");
  const [qty, setQty] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [date, setDate] = React.useState<DateValue>({
    ad: new Date().toISOString().slice(0, 10),
    bs: "",
  });
  const [memo, setMemo] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [binId, setBinId] = React.useState("");
  const [batchNo, setBatchNo] = React.useState("");
  const [lotNo, setLotNo] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [serialText, setSerialText] = React.useState("");
  const [allowNegative, setAllowNegative] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState("");

  // Load master data
  React.useEffect(() => {
    (async () => {
      try {
        const [itemData, accountData, settingsData, warehouseData] = await Promise.all([
          listItems({ isActive: true, take: 5000 }),
          listAccounts({ isActive: true, take: 2000 }),
          getInventorySettings(),
          listWarehouses({ isActive: true }),
        ]);
        setInventorySettings(settingsData);
        const warehouseList = Array.isArray(warehouseData) ? warehouseData : [];
        setWarehouses(warehouseList);
        if (settingsData.defaultWarehouseId) setWarehouseId(settingsData.defaultWarehouseId);
        setItems(
          (Array.isArray(itemData) ? itemData : [])
            .filter((i: any) => i.type !== "services" && i.trackInventory !== false)
            .map((i: any) => ({
              id: i.id,
              name: i.name,
              sku: i.sku,
              stock: i.stock ?? 0,
              isSerialized: i.isSerialized,
              tracksBatch: i.tracksBatch,
              tracksLot: i.tracksLot,
              tracksExpiry: i.tracksExpiry,
            }))
        );
        setAccounts(
          (Array.isArray(accountData) ? accountData : [])
            .filter((a: any) => a.isPostable !== false)
            .map((a: any) => ({ id: a.id, name: a.name, code: a.code }))
        );
      } catch {}
    })();
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const availableBins = selectedWarehouse?.bins ?? [];
  const amount =
    Number(qty) && Number(rate) ? Math.abs(Number(qty)) * Number(rate) : 0;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!itemId) return setError("Select an item");
    if (!qty || Number(qty) === 0) return setError("Enter a quantity");
    if (!accountId) return setError("Select an adjustment account");
    if (!date.ad) return setError("Select a date");
    if (inventorySettings?.requireWarehouseOnMovements && !warehouseId) return setError("Select a warehouse");
    if (selectedItem?.tracksBatch && !batchNo.trim()) return setError("Batch number is required for this item");
    if (selectedItem?.tracksLot && !lotNo.trim()) return setError("Lot number is required for this item");
    if (selectedItem?.tracksExpiry && !expiryDate) return setError("Expiry date is required for this item");
    if (allowNegative && !overrideReason.trim())
      return setError("Override reason is required");

    const finalQty =
      direction === "increase" ? Math.abs(Number(qty)) : -Math.abs(Number(qty));

    setSubmitting(true);
    try {
      const serialNumbers = serialText
        .split(/[\n,]+/)
        .map((serial) => serial.trim())
        .filter(Boolean);
      await adjustInventoryStock({
        itemId,
        qty: finalQty,
        rate: rate ? Number(rate) : undefined,
        accountId,
        warehouseId: warehouseId || undefined,
        binId: binId || undefined,
        date: date.ad,
        dateBs: date.bs || undefined,
        memo: memo.trim() || undefined,
        batchNo: batchNo.trim() || undefined,
        lotNo: lotNo.trim() || undefined,
        expiryDate: expiryDate || undefined,
        serialNumbers: serialNumbers.length ? serialNumbers : undefined,
        allowNegativeOverride: allowNegative || undefined,
        overrideReason: allowNegative ? overrideReason.trim() : undefined,
      });
      setSuccess("Stock adjustment posted successfully!");
      // Reset form after a short delay
      setTimeout(() => {
        setItemId("");
        setQty("");
        setRate("");
        setMemo("");
        setBatchNo("");
        setLotNo("");
        setExpiryDate("");
        setSerialText("");
        setAllowNegative(false);
        setOverrideReason("");
        setSuccess(null);
      }, 2000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to post stock adjustment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Stock Adjustment"
          description="Increase or decrease stock quantities with journal entry generation."
          icon={Package}
          breadcrumb={
            <button
              onClick={() => router.push("/inventory")}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Back to Inventory
            </button>
          }
        />
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Selection */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Item
              </h3>
              <SearchableSelect
                options={items.map((i) => ({
                  value: i.id,
                  label: `${i.name}${i.sku ? ` [${i.sku}]` : ""}`,
                }))}
                value={itemId}
                onChange={setItemId}
                placeholder="Search items..."
              />
              {selectedItem && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Current stock:</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      (selectedItem.stock ?? 0) <= 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    )}
                  >
                    {selectedItem.stock ?? 0} units
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Direction + Quantity */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Adjustment Details
              </h3>

              {/* Direction toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("increase")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 text-sm font-bold transition-all border-2",
                    direction === "increase"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                      : "bg-transparent text-muted-foreground border-border hover:border-emerald-300"
                  )}
                >
                  <ArrowUp className="h-4 w-4" /> Increase (Stock In)
                </button>
                <button
                  onClick={() => setDirection("decrease")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 text-sm font-bold transition-all border-2",
                    direction === "decrease"
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20"
                      : "bg-transparent text-muted-foreground border-border hover:border-red-300"
                  )}
                >
                  <ArrowDown className="h-4 w-4" /> Decrease (Stock Out)
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="rounded-xl h-12 text-lg font-bold tabular-nums"
                    min="0"
                    step="any"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Rate per unit
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="rounded-xl h-12 text-lg tabular-nums"
                    min="0"
                    step="any"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Adjustment Date *
                </label>
                <DualDateInput value={date} onChange={setDate} />
              </div>

              {/* Account */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Adjustment Account *
                </label>
                <SearchableSelect
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: `${a.code ? `${a.code} — ` : ""}${a.name}`,
                  }))}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="Select account..."
                />
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" /> The offset account for the journal entry (e.g.
                  Stock Adjustment, Inventory Shrinkage).
                </p>
              </div>

              {/* Memo */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Memo / Reason
                </label>
                <Input
                  placeholder="Reason for adjustment"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Batch/Lot (optional) */}
          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Tracking
              </h3>
              {inventorySettings?.warehousesEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Warehouse</label>
                    <SearchableSelect
                      options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
                      value={warehouseId}
                      onChange={(value) => { setWarehouseId(value); setBinId(""); }}
                      placeholder="Select warehouse..."
                    />
                  </div>
                  {inventorySettings.binsEnabled && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bin</label>
                      <SearchableSelect
                        options={availableBins.map((bin) => ({ value: bin.id, label: bin.name }))}
                        value={binId}
                        onChange={setBinId}
                        placeholder="Select bin..."
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
                {inventorySettings?.batchTrackingEnabled && <Input placeholder={selectedItem?.tracksBatch ? "Batch No. *" : "Batch No."} value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="rounded-xl" />}
                {inventorySettings?.lotTrackingEnabled && <Input placeholder={selectedItem?.tracksLot ? "Lot No. *" : "Lot No."} value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rounded-xl" />}
                {inventorySettings?.expiryTrackingEnabled && <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-xl" />}
              </div>
              {selectedItem?.isSerialized && inventorySettings?.serialTrackingEnabled && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial Numbers *</label>
                  <textarea
                    value={serialText}
                    onChange={(e) => setSerialText(e.target.value)}
                    placeholder="One serial per line, or comma separated"
                    className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Negative stock override */}
          {direction === "decrease" && (
            <Card className="border-amber-200 dark:border-amber-800/50 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowNegative"
                    checked={allowNegative}
                    onChange={(e) => setAllowNegative(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="allowNegative"
                    className="text-sm font-medium text-foreground"
                  >
                    Allow negative stock override
                  </label>
                </div>
                {allowNegative && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Override Reason *
                    </label>
                    <Input
                      placeholder="Why is negative stock being allowed?"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Preview */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl sticky top-6">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Preview
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-medium text-foreground truncate max-w-[60%] text-right">
                    {selectedItem?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Direction</span>
                  <span
                    className={cn(
                      "font-bold",
                      direction === "increase"
                        ? "text-emerald-600"
                        : "text-red-600"
                    )}
                  >
                    {direction === "increase" ? "▲ Increase" : "▼ Decrease"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-bold tabular-nums">
                    {qty || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <MoneyText value={Number(rate) || 0} />
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between text-sm">
                  <span className="font-bold text-foreground">Total Amount</span>
                  <MoneyText value={amount} className="text-lg font-black" />
                </div>

                {selectedItem && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Stock</span>
                      <span className="font-bold tabular-nums">
                        {selectedItem.stock ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Projected Stock</span>
                      <span
                        className={cn(
                          "font-black tabular-nums",
                          ((selectedItem.stock ?? 0) +
                            (direction === "increase"
                              ? Math.abs(Number(qty) || 0)
                              : -Math.abs(Number(qty) || 0))) < 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        )}
                      >
                        {(selectedItem.stock ?? 0) +
                          (direction === "increase"
                            ? Math.abs(Number(qty) || 0)
                            : -Math.abs(Number(qty) || 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" /> A journal voucher will be auto-created.
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !itemId || !qty || !accountId}
                  className={cn(
                    "w-full rounded-2xl h-12 font-bold shadow-lg text-white border-none",
                    direction === "increase"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  )}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitting
                    ? "Posting…"
                    : direction === "increase"
                    ? "Post Stock Increase"
                    : "Post Stock Decrease"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
