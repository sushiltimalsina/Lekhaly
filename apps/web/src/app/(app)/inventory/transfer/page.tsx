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
  ArrowRightLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Info,
  ArrowRight,
  Warehouse,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInventorySettings, transferInventoryStock, type InventorySettings } from "@/lib/api/inventory";
import { listItems } from "@/lib/api/items";
import {
  listWarehouses,
  type Warehouse as WarehouseType,
} from "@/lib/api/warehouses";

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

export default function StockTransferPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Master data
  const [items, setItems] = React.useState<ItemOption[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseType[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);

  // Form state
  const [itemId, setItemId] = React.useState("");
  const [fromWarehouseId, setFromWarehouseId] = React.useState("");
  const [fromBinId, setFromBinId] = React.useState("");
  const [toWarehouseId, setToWarehouseId] = React.useState("");
  const [toBinId, setToBinId] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [date, setDate] = React.useState<DateValue>({
    ad: new Date().toISOString().slice(0, 10),
    bs: "",
  });
  const [memo, setMemo] = React.useState("");
  const [batchNo, setBatchNo] = React.useState("");
  const [lotNo, setLotNo] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [serialText, setSerialText] = React.useState("");

  // Load master data
  React.useEffect(() => {
    (async () => {
      try {
        const [itemData, whData, settingsData] = await Promise.all([
          listItems({ isActive: true, take: 5000 }),
          listWarehouses({ isActive: true }),
          getInventorySettings(),
        ]);
        setInventorySettings(settingsData);
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
        setWarehouses(Array.isArray(whData) ? whData : []);
      } catch {}
    })();
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);
  const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);
  const fromBins = fromWarehouse?.bins?.filter((b) => b.isActive) ?? [];
  const toBins = toWarehouse?.bins?.filter((b) => b.isActive) ?? [];
  const amount = Number(qty) && Number(rate) ? Math.abs(Number(qty)) * Number(rate) : 0;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!itemId) return setError("Select an item");
    if (!fromWarehouseId) return setError("Select source warehouse");
    if (!toWarehouseId) return setError("Select destination warehouse");
    if (fromWarehouseId === toWarehouseId && (!fromBinId && !toBinId))
      return setError("Source and destination cannot be the same");
    if (fromWarehouseId === toWarehouseId && fromBinId === toBinId)
      return setError("Source and destination cannot be the same");
    if (!qty || Number(qty) <= 0) return setError("Enter a positive quantity");
    if (!date.ad) return setError("Select a date");
    if (selectedItem?.tracksBatch && !batchNo.trim()) return setError("Batch number is required for this item");
    if (selectedItem?.tracksLot && !lotNo.trim()) return setError("Lot number is required for this item");
    if (selectedItem?.tracksExpiry && !expiryDate) return setError("Expiry date is required for this item");

    setSubmitting(true);
    try {
      const serialNumbers = serialText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean);
      await transferInventoryStock({
        itemId,
        fromWarehouseId,
        fromBinId: fromBinId || undefined,
        toWarehouseId,
        toBinId: toBinId || undefined,
        qty: Number(qty),
        rate: rate ? Number(rate) : undefined,
        date: date.ad,
        dateBs: date.bs || undefined,
        memo: memo.trim() || undefined,
        batchNo: batchNo.trim() || undefined,
        lotNo: lotNo.trim() || undefined,
        expiryDate: expiryDate || undefined,
        serialNumbers: serialNumbers.length ? serialNumbers : undefined,
      });
      setSuccess("Stock transfer completed successfully!");
      setTimeout(() => {
        setItemId("");
        setFromWarehouseId("");
        setFromBinId("");
        setToWarehouseId("");
        setToBinId("");
        setQty("");
        setRate("");
        setMemo("");
        setBatchNo("");
        setLotNo("");
        setExpiryDate("");
        setSerialText("");
        setSuccess(null);
      }, 2000);
    } catch (e: any) {
      setError(e?.message ?? "Failed to transfer stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-foreground max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Stock Transfer"
          description="Move inventory between warehouses and storage locations."
          icon={ArrowRightLeft}
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

      {/* Item Selection */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Package className="h-3.5 w-3.5" /> Item
          </h3>
          <SearchableSelect
            options={items.map((i) => ({
              value: i.id,
              label: `${i.name}${i.sku ? ` (${i.sku})` : ""}`,
            }))}
            value={itemId}
            onChange={setItemId}
            placeholder="Search items..."
          />
          {selectedItem && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Total stock:</span>
              <span className="font-bold tabular-nums text-foreground">
                {selectedItem.stock ?? 0} units
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer direction: From → To */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* FROM */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2">
              <Warehouse className="h-3.5 w-3.5" /> Source (From)
            </h3>
            <SearchableSelect
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name}${w.code ? ` (${w.code})` : ""}`,
              }))}
              value={fromWarehouseId}
              onChange={(v) => {
                setFromWarehouseId(v);
                setFromBinId("");
              }}
              placeholder="Select source warehouse"
            />
            {fromBins.length > 0 && (
              <SearchableSelect
                options={[
                  { value: "", label: "No specific bin" },
                  ...fromBins.map((b) => ({
                    value: b.id,
                    label: `${b.name}${b.code ? ` (${b.code})` : ""}`,
                  })),
                ]}
                value={fromBinId}
                onChange={setFromBinId}
                placeholder="Select bin (optional)"
              />
            )}
          </CardContent>
        </Card>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ArrowRight className="h-6 w-6" />
          </div>
        </div>

        {/* TO */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Warehouse className="h-3.5 w-3.5" /> Destination (To)
            </h3>
            <SearchableSelect
              options={warehouses.map((w) => ({
                value: w.id,
                label: `${w.name}${w.code ? ` (${w.code})` : ""}`,
              }))}
              value={toWarehouseId}
              onChange={(v) => {
                setToWarehouseId(v);
                setToBinId("");
              }}
              placeholder="Select destination warehouse"
            />
            {toBins.length > 0 && (
              <SearchableSelect
                options={[
                  { value: "", label: "No specific bin" },
                  ...toBins.map((b) => ({
                    value: b.id,
                    label: `${b.name}${b.code ? ` (${b.code})` : ""}`,
                  })),
                ]}
                value={toBinId}
                onChange={setToBinId}
                placeholder="Select bin (optional)"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quantity & Details */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Transfer Details
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
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
                min="1"
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
                className="rounded-xl h-12 tabular-nums"
                min="0"
                step="any"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Transfer Date *
              </label>
              <DualDateInput value={date} onChange={setDate} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Memo / Reason
            </label>
            <Input
              placeholder="Reason for transfer"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Batch/Lot */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Tracking
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {inventorySettings?.batchTrackingEnabled && <Input placeholder={selectedItem?.tracksBatch ? "Batch No. *" : "Batch No."} value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="rounded-xl" />}
            {inventorySettings?.lotTrackingEnabled && <Input placeholder={selectedItem?.tracksLot ? "Lot No. *" : "Lot No."} value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rounded-xl" />}
            {inventorySettings?.expiryTrackingEnabled && <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-xl" />}
          </div>
          {selectedItem?.isSerialized && inventorySettings?.serialTrackingEnabled && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial Numbers *</label>
              <textarea value={serialText} onChange={(e) => setSerialText(e.target.value)} placeholder="One serial per line, or comma separated" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview & Submit */}
      <Card className="border-blue-200 dark:border-blue-800/50 shadow-xl">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Transfer Summary
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50">
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-bold text-foreground truncate">
                {fromWarehouse?.name || "—"}
                {fromBinId && fromBins.find((b) => b.id === fromBinId) && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / {fromBins.find((b) => b.id === fromBinId)?.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-500" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Qty</div>
                <div className="text-lg font-black tabular-nums">{qty || "0"}</div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-500" />
            </div>

            <div className="text-center sm:text-right flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">To</div>
              <div className="font-bold text-foreground truncate">
                {toWarehouse?.name || "—"}
                {toBinId && toBins.find((b) => b.id === toBinId) && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / {toBins.find((b) => b.id === toBinId)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Value</span>
              <MoneyText value={amount} className="font-bold" />
            </div>
          )}

          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3 shrink-0" /> Stock will be deducted from source and added to destination.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !itemId || !fromWarehouseId || !toWarehouseId || !qty}
            className="w-full rounded-2xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20"
          >
            <Save className="mr-2 h-4 w-4" />
            {submitting ? "Transferring…" : "Execute Transfer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
