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
import { hasLineTracking, inventoryFeatures } from "@/lib/inventory-features";
import { getInventorySettings, getTrackedStockOptions, transferInventoryStock, type InventorySettings, type TrackedStockOption } from "@/lib/api/inventory";
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
  defaultWarehouseId?: string | null;
  defaultBinId?: string | null;
  defaultBatchNo?: string | null;
  defaultLotNo?: string | null;
  defaultExpiryDate?: string | null;
  defaultExpiryDateBs?: string | null;
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
  const [trackingOptions, setTrackingOptions] = React.useState<TrackedStockOption[]>([]);

  // Load master data
  React.useEffect(() => {
    (async () => {
      try {
        const [itemData, whData, settingsData] = await Promise.all([
          listItems({ isActive: true, take: 1000 }),
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
              defaultWarehouseId: i.defaultWarehouseId,
              defaultBinId: i.defaultBinId,
              defaultBatchNo: i.defaultBatchNo,
              defaultLotNo: i.defaultLotNo,
              defaultExpiryDate: i.defaultExpiryDate,
              defaultExpiryDateBs: i.defaultExpiryDateBs,
            }))
        );
        setWarehouses(Array.isArray(whData) ? whData : []);
      } catch {}
    })();
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);
  const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);
  const features = inventoryFeatures(inventorySettings);
  const fromBins = features.bins ? fromWarehouse?.bins?.filter((b) => b.isActive) ?? [] : [];
  const toBins = features.bins ? toWarehouse?.bins?.filter((b) => b.isActive) ?? [] : [];
  const showTrackingCard = hasLineTracking(features) && (features.batch || features.lot || features.expiry || (features.serial && selectedItem?.isSerialized));
  const amount = Number(qty) && Number(rate) ? Math.abs(Number(qty)) * Number(rate) : 0;
  const trackingSelectOptions = trackingOptions.map((option, index) => ({
    value: String(index),
    label: [
      option.batchNo && `Batch ${option.batchNo}`,
      option.lotNo && `Lot ${option.lotNo}`,
      option.expiryDate && `Exp ${String(option.expiryDate).split("T")[0]}`,
      option.binName && `Bin ${option.binName}`,
      `Qty ${option.qty}`,
    ].filter(Boolean).join(" / "),
  }));

  React.useEffect(() => {
    if (!selectedItem) return;
    setFromWarehouseId(selectedItem.defaultWarehouseId || inventorySettings?.defaultWarehouseId || "");
    setFromBinId(selectedItem.defaultBinId || "");
    setBatchNo(selectedItem.defaultBatchNo || "");
    setLotNo(selectedItem.defaultLotNo || "");
    setExpiryDate(selectedItem.defaultExpiryDate ? String(selectedItem.defaultExpiryDate).split("T")[0] : "");
  }, [selectedItem?.id]);

  React.useEffect(() => {
    if (!itemId || !fromWarehouseId) {
      setTrackingOptions([]);
      return;
    }
    getTrackedStockOptions({ itemId, warehouseId: fromWarehouseId, binId: fromBinId || undefined })
      .then((res) => setTrackingOptions(res.options ?? []))
      .catch(() => setTrackingOptions([]));
  }, [itemId, fromWarehouseId, fromBinId]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!itemId) return setError("Select an item");
    if (!features.warehouses) return setError("Enable warehouses in inventory configuration before transferring stock");
    if (!fromWarehouseId) return setError("Select source warehouse");
    if (!toWarehouseId) return setError("Select destination warehouse");
    if (fromWarehouseId === toWarehouseId && (!fromBinId && !toBinId))
      return setError("Source and destination cannot be the same");
    if (fromWarehouseId === toWarehouseId && fromBinId === toBinId)
      return setError("Source and destination cannot be the same");
    if (!qty || Number(qty) <= 0) return setError("Enter a positive quantity");
    if (!date.ad) return setError("Select a date");
    if (features.batch && selectedItem?.tracksBatch && !batchNo.trim()) return setError("Batch number is required for this item");
    if (features.lot && selectedItem?.tracksLot && !lotNo.trim()) return setError("Lot number is required for this item");
    if (features.expiry && selectedItem?.tracksExpiry && !expiryDate) return setError("Expiry date is required for this item");

    setSubmitting(true);
    try {
      const serialNumbers = serialText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean);
      await transferInventoryStock({
        itemId,
        fromWarehouseId,
        fromBinId: features.bins ? fromBinId || undefined : undefined,
        toWarehouseId,
        toBinId: features.bins ? toBinId || undefined : undefined,
        qty: Number(qty),
        rate: rate ? Number(rate) : undefined,
        date: date.ad,
        dateBs: date.bs || undefined,
        memo: memo.trim() || undefined,
        batchNo: features.batch ? batchNo.trim() || undefined : undefined,
        lotNo: features.lot ? lotNo.trim() || undefined : undefined,
        expiryDate: features.expiry ? expiryDate || undefined : undefined,
        serialNumbers: features.serial && serialNumbers.length ? serialNumbers : undefined,
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
          description="Move inventory between warehouses, bins, and storage locations."
          icon={ArrowRightLeft}
          breadcrumb={
            <button
              onClick={() => router.push("/inventory")}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-orange-600 hover:bg-orange-600 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Inventory
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

      {inventorySettings && !features.warehouses && (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Enable Warehouses in Inventory Configuration to use stock transfers.
          </CardContent>
        </Card>
      )}

      {/* Item Selection */}
      {features.warehouses && <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Package className="h-3.5 w-3.5" /> Item and Date
          </h3>
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <SearchableSelect
              options={items.map((i) => ({
                value: i.id,
                label: `${i.name}${i.sku ? ` [${i.sku}]` : ""}`,
              }))}
              value={itemId}
              onChange={setItemId}
              placeholder="Search items..."
            />
            <DualDateInput label="Transfer Date" value={date} onChange={setDate} required />
          </div>
          {selectedItem && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Total stock:</span>
              <span className="font-bold tabular-nums text-foreground">
                {selectedItem.stock ?? 0} units
              </span>
            </div>
          )}
        </CardContent>
      </Card>}

      {/* Transfer direction: From → To */}
      {features.warehouses && <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* FROM */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-2">
              <Warehouse className="h-3.5 w-3.5" /> Source Warehouse and Bin
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
            {features.bins && (
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
                placeholder={fromWarehouseId ? "Select source bin (optional)" : "Choose warehouse first"}
                disabled={!fromWarehouseId}
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
              <Warehouse className="h-3.5 w-3.5" /> Destination Warehouse and Bin
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
            {features.bins && (
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
                placeholder={toWarehouseId ? "Select destination bin (optional)" : "Choose warehouse first"}
                disabled={!toWarehouseId}
              />
            )}
          </CardContent>
        </Card>
      </div>}

      {/* Quantity & Details */}
      {features.warehouses && <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Transfer Details
          </h3>

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
      </Card>}

      {/* Batch/Lot */}
      {features.warehouses && showTrackingCard && <Card className="border-border/50 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Tracking
          </h3>
          {trackingSelectOptions.length > 0 && (
            <SearchableSelect
              options={[{ value: "", label: "Choose available batch / lot / expiry" }, ...trackingSelectOptions]}
              value=""
              onChange={(value) => {
                const option = trackingOptions[Number(value)];
                if (!option) return;
                setBatchNo(option.batchNo || "");
                setLotNo(option.lotNo || "");
                setExpiryDate(option.expiryDate ? String(option.expiryDate).split("T")[0] : "");
                setRate(option.rate ? String(option.rate) : rate);
              }}
              placeholder="Choose from available source stock..."
            />
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {features.batch && <Input placeholder={selectedItem?.tracksBatch ? "Batch Number *" : "Batch Number"} value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="rounded-xl" />}
            {features.lot && <Input placeholder={selectedItem?.tracksLot ? "Lot Number *" : "Lot Number"} value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rounded-xl" />}
            {features.expiry && (
              <DualDateInput
                label="Expiry Date"
                value={{ ad: expiryDate, bs: "" }}
                onChange={(next) => setExpiryDate(next.ad)}
                required={Boolean(selectedItem?.tracksExpiry)}
              />
            )}
          </div>
          {selectedItem?.isSerialized && features.serial && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Serial Numbers *</label>
              <textarea value={serialText} onChange={(e) => setSerialText(e.target.value)} placeholder="One serial per line, or comma separated" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
            </div>
          )}
        </CardContent>
      </Card>}

      {/* Preview & Submit */}
      {features.warehouses && <Card className="border-blue-200 dark:border-blue-800/50 shadow-xl">
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
      </Card>}
    </div>
  );
}
