"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  CalendarCheck,
  PackageSearch,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  XCircle
} from "lucide-react";
import { Button, Card, CardContent } from "@lekhaly/ui";
import PageHeader from "@/components/app/page-header";
import { MoneyText } from "@/components/app/money";
import DualDateInput from "@/components/app/dual-date-input";
import SearchableSelect from "@/components/app/searchable-select";
import { cn } from "@/lib/utils";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";
import { getSalesOrder, listSalesOrders } from "@/lib/api/sales-orders";
import { listPurchaseOrders } from "@/lib/api/purchase-orders";
import {
  approveInventoryMovement,
  closeInventoryPeriod,
  createInventoryMovementApproval,
  getInventorySettings,
  getReorderSuggestions,
  listBatchLotMaster,
  listGoodsReceipts,
  listInventoryMovementApprovals,
  listInventoryPeriodCloses,
  listStockDispatches,
  listStockReservations,
  postGoodsReceipt,
  postStockDispatch,
  rejectInventoryMovement,
  releaseStockReservation,
  reserveSalesOrderStock,
  reverseInventoryMovement,
  type GoodsReceiptInput,
  type GoodsReceiptRecord,
  type InventorySettings,
  type InventoryMovementApproval,
  type InventoryPeriodClose,
  type InventoryMovementLineInput,
  type StockDispatchInput,
  type StockDispatchRecord,
  type StockReservationRecord
} from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";

type Status = { type: "success" | "error"; message: string } | null;

const inputClass = "h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-orange-500";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";
const REORDER_PO_DRAFT_KEY = "lekhaly.reorderPurchaseOrderDraft";

function normalizeItems(res: Awaited<ReturnType<typeof listItems>>) {
  const rows = Array.isArray(res) ? res : res?.items ?? [];
  return rows.filter((item) => item.type !== "services" && item.trackInventory !== false);
}

function normalizeWarehouses(res: any): Warehouse[] {
  return Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
}

function normalizeOrders(res: any): any[] {
  return Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
}

function pendingPurchaseOrders(rows: any[]) {
  return rows.filter((order) => {
    if (order.status === "cancelled" || order.status === "received") return false;
    const lines = order.items ?? [];
    return lines.some((line: any) => line.itemId && Number(line.qty ?? 0) > Number(line.receivedQty ?? 0));
  });
}

function normalizeGoodsReceipts(res: any): GoodsReceiptRecord[] {
  return Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
}

function toDateInputValue(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function generateDispatchNumber() {
  const now = new Date();
  const dateCode = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DS-${dateCode}-${randomSuffix}`;
}

function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div className={cn(
      "rounded-xl border px-4 py-3 text-sm font-medium",
      status.type === "success"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300"
    )}>
      {status.message}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function WorkflowShell({
  title,
  description,
  icon,
  children,
  actions,
  backLabel = "Back to Inventory",
  onBack
}: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
}) {
  return (
    <div className="space-y-6 pb-20">
      <PageHeader title={title} description={description} icon={icon} showBack backHref="/inventory" backLabel={backLabel} onBack={onBack} actions={actions} />
      {children}
    </div>
  );
}

function LineForm({
  mode,
  onSubmit
}: {
  mode: "receipt" | "dispatch";
  onSubmit: (input: GoodsReceiptInput | StockDispatchInput) => Promise<unknown>;
}) {
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<Status>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    documentNo: "",
    sourceId: "",
    partyId: "",
    date: { ad: new Date().toISOString().slice(0, 10), bs: "" },
    memo: "",
    orderLineId: "",
    itemId: "",
    qty: "1",
    rate: "",
    warehouseId: "",
    binId: "",
    batchNo: "",
    lotNo: "",
    expiryDate: ""
  });

  React.useEffect(() => {
    Promise.all([
      listItems({ isActive: true, take: 1000 }).then(normalizeItems),
      listWarehouses({ isActive: true }).then(normalizeWarehouses),
      (mode === "receipt"
        ? listPurchaseOrders({ status: "open" as any, take: 100 })
        : listSalesOrders({ status: "open", take: 100 })
      ).then(normalizeOrders)
    ]).then(([itemRows, warehouseRows, orderRows]) => {
      setItems(itemRows);
      setWarehouses(warehouseRows);
      setOrders(orderRows);
      setForm((prev) => ({
        ...prev,
        itemId: prev.itemId || itemRows[0]?.id || "",
        warehouseId: prev.warehouseId || warehouseRows[0]?.id || ""
      }));
    }).catch(() => {
      setItems([]);
      setWarehouses([]);
    });
  }, []);

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === form.warehouseId);
  const bins = selectedWarehouse?.bins ?? [];
  const selectedOrder = orders.find((order) => order.id === form.sourceId);
  const orderLines = selectedOrder?.items ?? [];
  const selectedLine = orderLines.find((line: any) => line.id === form.orderLineId);

  const applyOrderSelection = (orderId: string) => {
    const order = orders.find((row) => row.id === orderId);
    const firstLine = order?.items?.find((line: any) => line.itemId) ?? order?.items?.[0];
    const qty = firstLine
      ? Number(firstLine.qty ?? 0) - Number(firstLine.fulfilledQty ?? firstLine.receivedQty ?? 0)
      : 1;
    setForm((prev) => ({
      ...prev,
      sourceId: orderId,
      partyId: order?.partyId ?? order?.party?.id ?? "",
      orderLineId: firstLine?.id ?? "",
      itemId: firstLine?.itemId ?? prev.itemId,
      qty: String(Math.max(qty, 0) || 1),
      rate: firstLine?.rate ? String(firstLine.rate) : prev.rate
    }));
  };

  const applyOrderLineSelection = (lineId: string) => {
    const line = orderLines.find((row: any) => row.id === lineId);
    const qty = line ? Number(line.qty ?? 0) - Number(line.fulfilledQty ?? line.receivedQty ?? 0) : 1;
    setForm((prev) => ({
      ...prev,
      orderLineId: lineId,
      itemId: line?.itemId ?? prev.itemId,
      qty: String(Math.max(qty, 0) || 1),
      rate: line?.rate ? String(line.rate) : prev.rate
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!form.itemId) {
      setStatus({ type: "error", message: "Select an item first." });
      return;
    }
    setSaving(true);
    try {
      const line: InventoryMovementLineInput = {
        itemId: form.itemId,
        qty: Number(form.qty || 0),
        rate: form.rate ? Number(form.rate) : undefined,
        warehouseId: form.warehouseId || undefined,
        binId: form.binId || undefined,
        batchNo: form.batchNo.trim() || undefined,
        lotNo: form.lotNo.trim() || undefined,
        expiryDate: form.expiryDate || undefined
      };
      const payload = mode === "receipt"
        ? {
            receiptNo: form.documentNo.trim() || undefined,
            purchaseOrderId: form.sourceId.trim() || undefined,
            supplierId: form.partyId.trim() || undefined,
            date: form.date.ad,
            dateBs: form.date.bs || undefined,
            memo: form.memo.trim() || undefined,
            lines: [line]
          }
        : {
            dispatchNo: form.documentNo.trim() || undefined,
            salesOrderId: form.sourceId.trim() || undefined,
            customerId: form.partyId.trim() || undefined,
            date: form.date.ad,
            dateBs: form.date.bs || undefined,
            memo: form.memo.trim() || undefined,
            lines: [line]
          };
      await onSubmit(payload);
      setStatus({ type: "success", message: mode === "receipt" ? "Goods receipt posted." : "Stock dispatch posted." });
      setForm((prev) => ({ ...prev, qty: "1", memo: "", batchNo: "", lotNo: "", expiryDate: "" }));
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to post inventory movement." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <StatusMessage status={status} />
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label={mode === "receipt" ? "Receipt No" : "Dispatch No"}>
              <input className={inputClass} value={form.documentNo} onChange={(e) => setForm({ ...form, documentNo: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label={mode === "receipt" ? "Purchase Order" : "Sales Order"}>
              <select className={inputClass} value={form.sourceId} onChange={(e) => applyOrderSelection(e.target.value)}>
                <option value="">Manual movement</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNo || order.id} - {order.party?.name || order.partyName || "No party"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Order Line">
              <select className={inputClass} value={form.orderLineId} onChange={(e) => applyOrderLineSelection(e.target.value)} disabled={!selectedOrder}>
                <option value="">Select line</option>
                {orderLines.map((line: any) => (
                  <option key={line.id} value={line.id}>
                    {line.item?.name || line.description || line.itemId || "Line"} - Qty {line.qty}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <DualDateInput value={form.date} onChange={(date) => setForm({ ...form, date })} accentColor="bg-orange-600" />
            </Field>
          </div>
          {selectedOrder && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <div><div className={labelClass}>Order No</div><div className="font-bold">{selectedOrder.orderNo || "-"}</div></div>
                <div><div className={labelClass}>{mode === "receipt" ? "Supplier" : "Customer"}</div><div className="font-bold">{selectedOrder.party?.name || selectedOrder.partyName || "-"}</div></div>
                <div><div className={labelClass}>Status</div><div className="font-bold capitalize">{selectedOrder.status || "-"}</div></div>
                <div><div className={labelClass}>Total</div><MoneyText value={Number(selectedOrder.total ?? 0)} className="font-bold" /></div>
              </div>
              {selectedLine && (
                <div className="mt-3 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                  Selected line: <span className="font-bold text-foreground">{selectedLine.item?.name || selectedLine.description || selectedLine.itemId}</span>
                  <span className="ml-3">Ordered: {String(selectedLine.qty ?? "-")}</span>
                  <span className="ml-3">{mode === "receipt" ? "Received" : "Fulfilled"}: {String(selectedLine.receivedQty ?? selectedLine.fulfilledQty ?? 0)}</span>
                </div>
              )}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Item">
              <select className={inputClass} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                <option value="">Select item</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}{item.sku ? ` [${item.sku}]` : ""}</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input type="number" min="0" step="0.01" className={inputClass} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            </Field>
            <Field label="Rate">
              <input type="number" min="0" step="0.01" className={inputClass} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="Default cost" />
            </Field>
            <Field label="Warehouse">
              <select className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value, binId: "" })}>
                <option value="">No warehouse</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </Field>
            <Field label="Bin">
              <select className={inputClass} value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })}>
                <option value="">No bin</option>
                {bins.map((bin: any) => <option key={bin.id} value={bin.id}>{bin.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Batch No">
              <input className={inputClass} value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} />
            </Field>
            <Field label="Lot No">
              <input className={inputClass} value={form.lotNo} onChange={(e) => setForm({ ...form, lotNo: e.target.value })} />
            </Field>
            <Field label="Expiry Date">
              <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </Field>
            <Field label="Memo">
              <input className={inputClass} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="Reason or note" />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? "Posting..." : mode === "receipt" ? "Post Goods Receipt" : "Post Dispatch"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-2"><span className={labelClass}>{label}</span>{children}</label>;
}

export function GoodsReceiptWorkflowPage() {
  const [view, setView] = React.useState<"register" | "create">("register");
  const [settings, setSettings] = React.useState<InventorySettings | null>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [receipts, setReceipts] = React.useState<GoodsReceiptRecord[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [receiptSearch, setReceiptSearch] = React.useState("");
  const [date, setDate] = React.useState({ ad: new Date().toISOString().slice(0, 10), bs: "" });
  const [memo, setMemo] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [binId, setBinId] = React.useState("");
  const [lines, setLines] = React.useState<Array<{
    lineId: string;
    itemId: string;
    name: string;
    orderedQty: number;
    receivedQty: number;
    receiveQty: string;
    rate: string;
    batchNo: string;
    lotNo: string;
    expiryDate: string;
    expiryDateBs: string;
  }>>([]);
  const [status, setStatus] = React.useState<Status>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const receiptDateRef = React.useRef<HTMLInputElement | null>(null);
  const purchaseOrderRef = React.useRef<HTMLButtonElement | null>(null);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId);
  const bins = selectedWarehouse?.bins ?? [];
  const features = inventoryFeatures(settings);
  const selectedOrderTotals = React.useMemo(() => {
    const orderLines = selectedOrder?.items ?? [];
    const orderedQty = orderLines.reduce((sum: number, line: any) => sum + Number(line.qty ?? 0), 0);
    const receivedQty = orderLines.reduce((sum: number, line: any) => sum + Number(line.receivedQty ?? 0), 0);
    const pendingQty = Math.max(orderedQty - receivedQty, 0);
    const pendingValue = orderLines.reduce((sum: number, line: any) => {
      const pending = Math.max(Number(line.qty ?? 0) - Number(line.receivedQty ?? 0), 0);
      return sum + pending * Number(line.rate ?? 0);
    }, 0);
    return { lineCount: orderLines.length, orderedQty, receivedQty, pendingQty, pendingValue };
  }, [selectedOrder]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData, orderRows, warehouseRows, receiptRows] = await Promise.all([
        getInventorySettings(),
        listPurchaseOrders({ take: 200 }).then((res) => pendingPurchaseOrders(normalizeOrders(res))),
        listWarehouses({ isActive: true }).then(normalizeWarehouses),
        listGoodsReceipts({ take: 50, q: receiptSearch || undefined }).then(normalizeGoodsReceipts)
      ]);
      setSettings(settingsData);
      setOrders(orderRows);
      setWarehouses(warehouseRows);
      setReceipts(receiptRows);
      setWarehouseId((current) => current || warehouseRows[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, [receiptSearch]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (view !== "create") return;
    const timer = window.setTimeout(() => {
      receiptDateRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [view]);

  React.useEffect(() => {
    if (view !== "create" || selectedOrderId || !orders[0]) return;
    applyPurchaseOrder(orders[0], warehouseId);
  }, [orders, selectedOrderId, view, warehouseId]);

  const applyPurchaseOrder = (order: any, nextWarehouseId = warehouseId) => {
    setSelectedOrderId(order?.id || "");
    setLines((order?.items ?? [])
      .filter((line: any) => line.itemId)
      .map((line: any) => {
        const orderedQty = Number(line.qty ?? 0);
        const receivedQty = Number(line.receivedQty ?? 0);
        const pendingQty = Math.max(orderedQty - receivedQty, 0);
        return {
          lineId: line.id,
          itemId: line.itemId,
          name: line.item?.name || line.description || line.itemId,
          orderedQty,
          receivedQty,
          receiveQty: pendingQty ? String(pendingQty) : "0",
          rate: line.rate ? String(line.rate) : "",
          batchNo: "",
          lotNo: "",
          expiryDate: "",
          expiryDateBs: ""
        };
      }));
    setWarehouseId(nextWarehouseId || warehouseId);
    setBinId("");
  };

  const updateLine = (lineId: string, patch: Partial<(typeof lines)[number]>) => {
    setLines((prev) => prev.map((line) => line.lineId === lineId ? { ...line, ...patch } : line));
  };

  const submit = async () => {
    setStatus(null);
    if (!selectedOrder) return setStatus({ type: "error", message: "Select a purchase order first." });
    const receiptLines = lines
      .map((line) => ({
        ...line,
        qtyNumber: Number(line.receiveQty || 0),
        rateNumber: Number(line.rate || 0)
      }))
      .filter((line) => line.qtyNumber > 0);
    if (!receiptLines.length) return setStatus({ type: "error", message: "Enter received quantity for at least one item." });
    const overReceived = receiptLines.find((line) => line.qtyNumber > Math.max(line.orderedQty - line.receivedQty, 0));
    if (overReceived) return setStatus({ type: "error", message: `Received quantity exceeds pending quantity for ${overReceived.name}.` });
    const missingRate = receiptLines.find((line) => line.rateNumber <= 0);
    if (missingRate) return setStatus({ type: "error", message: `Rate is required for ${missingRate.name}.` });

    setSaving(true);
    try {
      await postGoodsReceipt({
        purchaseOrderId: selectedOrder.id,
        supplierId: selectedOrder.partyId || selectedOrder.party?.id,
        date: date.ad,
        dateBs: date.bs || undefined,
        memo: memo.trim() || undefined,
        lines: receiptLines.map((line) => ({
          itemId: line.itemId,
          qty: line.qtyNumber,
          rate: line.rateNumber,
          warehouseId: warehouseId || undefined,
          binId: binId || undefined,
          batchNo: line.batchNo.trim() || undefined,
          lotNo: line.lotNo.trim() || undefined,
          expiryDate: line.expiryDate || undefined,
          expiryDateBs: line.expiryDateBs || undefined
        }))
      });
      setStatus({ type: "success", message: "Goods receipt posted and purchase order received quantity updated." });
      setMemo("");
      await refresh();
      setView("register");
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to post goods receipt." });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setStatus(null);
    setView("create");
    if (!selectedOrderId && orders[0]) applyPurchaseOrder(orders[0], warehouseId);
  };

  return (
    <WorkflowShell
      title={view === "create" ? "Create Goods Receipt" : "Goods Receipt Register"}
      description={view === "create" ? "Receive items from purchase orders into warehouse and bin stock." : "Review posted goods receipts and create new receiving entries."}
      icon={ArrowDownToLine}
      backLabel={view === "create" ? "Back to Register" : "Back to Inventory"}
      onBack={view === "create" ? () => setView("register") : undefined}
      actions={
        view === "register" ? (
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            {features.goodsReceipt && <Button type="button" onClick={openCreate} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              New Goods Receipt
            </Button>}
          </div>
        ) : null
      }
    >
      {!settings && (
        <Card>
          <CardContent className="pt-6">
            <EmptyState text="Loading goods receipt configuration..." />
          </CardContent>
        </Card>
      )}
      {settings && !features.goodsReceipt && (
        <Card>
          <CardContent className="pt-6">
            <EmptyState text="Goods Receipt Workflow is disabled. Enable it from Configuration > Inventory Configuration to use GRN receiving." />
          </CardContent>
        </Card>
      )}
      {features.goodsReceipt && view === "create" && (
        <Card>
          <CardContent className="space-y-5 pt-6">
          <StatusMessage status={status} />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Purchase Order">
              <SearchableSelect
                buttonRef={purchaseOrderRef}
                options={orders}
                value={selectedOrderId}
                onChange={(_, order) => applyPurchaseOrder(order)}
                getLabel={(order) => `${order.orderNo || order.id} - ${order.party?.name || order.partyName || "No supplier"}`}
                getDetail={(order) => `Rs. ${Number(order.total ?? 0).toLocaleString("en-IN")}`}
                placeholder="Search PO number or supplier..."
                emptyText="No open purchase orders found"
                buttonClassName="h-11 rounded-xl bg-background"
              />
            </Field>
            <Field label="Warehouse">
              <select className={inputClass} value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setBinId(""); }}>
                <option value="">No warehouse</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </Field>
            <Field label="Bin">
              <select className={inputClass} value={binId} onChange={(e) => setBinId(e.target.value)}>
                <option value="">No bin</option>
                {bins.map((bin: any) => <option key={bin.id} value={bin.id}>{bin.name}</option>)}
              </select>
            </Field>
            <Field label="Receipt Date">
              <DualDateInput ref={receiptDateRef} value={date} onChange={setDate} accentColor="bg-orange-600" onEnterNext={() => purchaseOrderRef.current?.focus()} />
            </Field>
          </div>
          {selectedOrder ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div><div className={labelClass}>PO Number</div><div className="font-bold">{selectedOrder.orderNo || "-"}</div></div>
                <div><div className={labelClass}>Supplier</div><div className="font-bold">{selectedOrder.party?.name || selectedOrder.partyName || "-"}</div></div>
                <div><div className={labelClass}>Status</div><div className="font-bold capitalize">{selectedOrder.status || "-"}</div></div>
                <div><div className={labelClass}>PO Total</div><MoneyText value={Number(selectedOrder.total ?? 0)} className="font-bold" /></div>
              </div>
              <div className="grid gap-3 border-t border-border/70 pt-3 md:grid-cols-4">
                <div><div className={labelClass}>Lines</div><div className="font-bold tabular-nums">{selectedOrderTotals.lineCount}</div></div>
                <div><div className={labelClass}>Pending Qty</div><div className="font-bold tabular-nums">{selectedOrderTotals.pendingQty}</div></div>
                <div><div className={labelClass}>Received Qty</div><div className="font-bold tabular-nums">{selectedOrderTotals.receivedQty}</div></div>
                <div><div className={labelClass}>Pending Value</div><MoneyText value={selectedOrderTotals.pendingValue} className="font-bold text-emerald-600 dark:text-emerald-300" /></div>
              </div>
            </div>
          ) : loading ? (
            <EmptyState text="Loading purchase orders..." />
          ) : (
            <EmptyState text="No open purchase order found. Create a purchase order before posting GRN." />
          )}
          {lines.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className={cn("w-full text-sm", features.batch || features.lot || features.expiry ? "min-w-[1100px]" : "min-w-[860px]")}>
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3 text-right">Ordered</th>
                    <th className="px-3 py-3 text-right">Received</th>
                    <th className="px-3 py-3 text-right">Pending</th>
                    <th className="px-3 py-3">Receive Qty</th>
                    <th className="px-3 py-3">Rate</th>
                    <th className="px-3 py-3 text-right">Receive Value</th>
                    {features.batch && <th className="px-3 py-3">Batch No</th>}
                    {features.lot && <th className="px-3 py-3">Lot No</th>}
                    {features.expiry && <th className="px-3 py-3">Expiry</th>}
                    <th className="w-12 px-3 py-3 text-right" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line) => {
                    const pending = Math.max(line.orderedQty - line.receivedQty, 0);
                    return (
                      <tr key={line.lineId}>
                        <td className="px-3 py-3 font-bold">{line.name}</td>
                        <td className="px-3 py-3 text-right">{line.orderedQty}</td>
                        <td className="px-3 py-3 text-right">{line.receivedQty}</td>
                        <td className="px-3 py-3 text-right font-bold">{pending}</td>
                        <td className="px-3 py-3"><input type="number" min="0" max={pending} step="0.01" className={cn(inputClass, "w-28")} value={line.receiveQty} onChange={(e) => updateLine(line.lineId, { receiveQty: e.target.value })} /></td>
                        <td className="px-3 py-3"><input type="number" min="0" step="0.01" className={cn(inputClass, "w-28")} value={line.rate} onChange={(e) => updateLine(line.lineId, { rate: e.target.value })} /></td>
                        <td className="px-3 py-3 text-right"><MoneyText value={Number(line.receiveQty || 0) * Number(line.rate || 0)} className="font-bold" /></td>
                        {features.batch && <td className="px-3 py-3"><input className={cn(inputClass, "w-36")} value={line.batchNo} onChange={(e) => updateLine(line.lineId, { batchNo: e.target.value })} /></td>}
                        {features.lot && <td className="px-3 py-3"><input className={cn(inputClass, "w-36")} value={line.lotNo} onChange={(e) => updateLine(line.lineId, { lotNo: e.target.value })} /></td>}
                        {features.expiry && (
                          <td className="px-3 py-3">
                            <div className="w-48">
                              <DualDateInput
                                value={{ ad: line.expiryDate, bs: line.expiryDateBs }}
                                onChange={(next) => updateLine(line.lineId, { expiryDate: next.ad, expiryDateBs: next.bs })}
                                accentColor="bg-orange-600"
                              />
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-3 text-right">
                          <button type="button" onClick={() => setLines((prev) => prev.filter((row) => row.lineId !== line.lineId))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10" title="Remove row">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Field label="Memo">
            <input className={inputClass} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Delivery note, vehicle no, receiving remarks" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving || !selectedOrder} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? "Posting..." : "Post Goods Receipt"}
            </Button>
          </div>
          </CardContent>
        </Card>
      )}
      {features.goodsReceipt && view === "register" && (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">Goods Receipt Register</h2>
              <p className="text-sm text-muted-foreground">Posted receipts issued from purchase orders and direct receiving.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className={cn(inputClass, "w-full sm:w-72")}
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="Search GRN, PO, supplier, item..."
              />
              <Button variant="outline" type="button" onClick={refresh} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
          {receipts.length ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Receipt</th>
                    <th className="px-3 py-3">Purchase Order</th>
                    <th className="px-3 py-3">Supplier</th>
                    <th className="px-3 py-3 text-right">Items</th>
                    <th className="px-3 py-3 text-right">Qty</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="align-top">
                      <td className="px-3 py-3 font-medium">{toDateInputValue(receipt.date) || "-"}</td>
                      <td className="px-3 py-3">
                        <div className="font-bold">{receipt.receiptNo || `GRN-${receipt.id.slice(0, 8).toUpperCase()}`}</div>
                        {receipt.memo && <div className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{receipt.memo}</div>}
                      </td>
                      <td className="px-3 py-3 font-medium">{receipt.purchaseOrderNo || "-"}</td>
                      <td className="px-3 py-3">{receipt.supplierName || "-"}</td>
                      <td className="px-3 py-3 text-right">{receipt.lineCount}</td>
                      <td className="px-3 py-3 text-right font-bold">{Number(receipt.totalQty || 0)}</td>
                      <td className="px-3 py-3 text-right"><MoneyText value={Number(receipt.totalAmount || 0)} className="font-bold" /></td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold capitalize text-emerald-600 dark:text-emerald-300">
                          {receipt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text={loading ? "Loading goods receipts..." : "No goods receipts posted yet."} />
          )}
        </CardContent>
      </Card>
      )}
    </WorkflowShell>
  );
}

export function DispatchWorkflowPage() {
  const [view, setView] = React.useState<"register" | "create">("register");
  const [dispatches, setDispatches] = React.useState<StockDispatchRecord[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = React.useState<any>(null);
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [dispatchSearch, setDispatchSearch] = React.useState("");
  const [dispatchLines, setDispatchLines] = React.useState<Array<{
    id: string;
    itemId: string;
    itemName: string;
    qty: number;
    rate: number;
    warehouseId: string;
    binId: string;
    batchNo: string;
    lotNo: string;
    expiryDate: string;
  }>>([]);
  const [form, setForm] = React.useState({
    dispatchNo: "",
    sourceId: "",
    date: { ad: new Date().toISOString().slice(0, 10), bs: "" },
    memo: "",
    warehouseId: "",
    binId: ""
  });
  const [status, setStatus] = React.useState<Status>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const dateRef = React.useRef<HTMLInputElement | null>(null);

  const selectedOrder = selectedOrderDetails ?? orders.find((order) => order.id === form.sourceId);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === form.warehouseId);
  const bins = selectedWarehouse?.bins ?? [];

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [orderRows, itemRows, warehouseRows, dispatchRows] = await Promise.all([
        listSalesOrders({ status: "open", take: 100 }).then(normalizeOrders),
        listItems({ isActive: true, take: 1000 }).then(normalizeItems),
        listWarehouses({ isActive: true }).then(normalizeWarehouses),
        listStockDispatches({ q: dispatchSearch || undefined, take: 100 })
      ]);
      setOrders(orderRows || []);
      setItems(itemRows || []);
      setWarehouses(warehouseRows || []);
      setDispatches(dispatchRows?.data || []);
      setForm((current) => ({
        ...current,
        sourceId: current.sourceId || orderRows?.[0]?.id || "",
        warehouseId: current.warehouseId || warehouseRows?.[0]?.id || ""
      }));
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Failed to load dispatch data." });
      setOrders([]);
      setItems([]);
      setWarehouses([]);
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  }, [dispatchSearch]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (view === "create" && orders.length === 0) refresh();
  }, [view, refresh, orders.length]);

  React.useEffect(() => {
    if (!form.sourceId) {
      setSelectedOrderDetails(null);
      setDispatchLines([]);
      return;
    }

    const buildLines = (order: any) => {
      setDispatchLines((order.items ?? [])
        .filter((line: any) => line.itemId)
        .map((line: any, idx: number) => ({
          id: line.id || `${form.sourceId}-${idx}`,
          itemId: line.itemId || "",
          itemName: line.item?.name || line.description || line.itemId || "",
          qty: Math.max(Number(line.qty ?? 0) - Number(line.fulfilledQty ?? 0), 0),
          rate: Number(line.rate ?? 0),
          warehouseId: form.warehouseId || "",
          binId: form.binId || "",
          batchNo: "",
          lotNo: "",
          expiryDate: ""
        }))
        .filter((line: any) => line.qty > 0));
    };

    const orderFromList = orders.find((order) => order.id === form.sourceId);
    if (orderFromList?.items?.length) {
      setSelectedOrderDetails(orderFromList);
      buildLines(orderFromList);
      return;
    }

    let cancelled = false;
    getSalesOrder(form.sourceId)
      .then((fullOrder) => {
        if (cancelled) return;
        setSelectedOrderDetails(fullOrder);
        buildLines(fullOrder);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedOrderDetails(orderFromList ?? null);
          setDispatchLines([]);
        }
      });
    return () => { cancelled = true; };
  }, [form.sourceId, form.warehouseId, form.binId, orders]);

  React.useEffect(() => {
    if (view !== "create") return;
    const timer = window.setTimeout(() => dateRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [view]);

  const submitDispatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (dispatchLines.length === 0) return setStatus({ type: "error", message: "Add items to dispatch first." });
    if (!dispatchLines.every((line) => line.itemId && line.qty > 0)) {
      return setStatus({ type: "error", message: "All items must have valid quantities." });
    }

    setSaving(true);
    try {
      await postStockDispatch({
        dispatchNo: form.dispatchNo || undefined,
        salesOrderId: form.sourceId || undefined,
        customerId: selectedOrder?.partyId || selectedOrder?.party?.id || undefined,
        date: form.date.ad,
        dateBs: form.date.bs || undefined,
        memo: form.memo.trim() || undefined,
        lines: dispatchLines.map((line) => ({
          itemId: line.itemId,
          qty: line.qty,
          rate: line.rate || undefined,
          warehouseId: line.warehouseId || form.warehouseId || undefined,
          binId: line.binId || form.binId || undefined,
          batchNo: line.batchNo.trim() || undefined,
          lotNo: line.lotNo.trim() || undefined,
          expiryDate: line.expiryDate || undefined
        }))
      });
      setStatus({ type: "success", message: "Dispatch posted successfully." });
      setForm((prev) => ({ ...prev, dispatchNo: generateDispatchNumber(), memo: "", warehouseId: "", binId: "" }));
      setDispatchLines([]);
      await refresh();
      setView("register");
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to post dispatch." });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setStatus(null);
    setForm((prev) => ({
      ...prev,
      dispatchNo: prev.dispatchNo || generateDispatchNumber(),
      date: { ad: new Date().toISOString().slice(0, 10), bs: "" }
    }));
    setView("create");
  };

  return (
    <WorkflowShell
      title={view === "create" ? "Create Dispatch" : "Dispatch Register"}
      description={view === "create" ? "Create a delivery dispatch and issue stock for customer delivery." : "Review posted delivery dispatches and create new dispatches."}
      icon={ArrowUpFromLine}
      backLabel={view === "create" ? "Back to Register" : "Back to Inventory"}
      onBack={view === "create" ? () => setView("register") : undefined}
              actions={view === "register" ? (
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" onClick={openCreate} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Dispatch
          </Button>
        </div>
      ) : null}
    >
      <StatusMessage status={status} />
      {view === "create" ? (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <form onSubmit={submitDispatch} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Dispatch No">
                  <input className={inputClass} value={form.dispatchNo} readOnly placeholder="System generated" />
                </Field>
                <Field label="Sales Order">
                  <SearchableSelect
                    options={orders}
                    value={form.sourceId}
                    onChange={(_, order) => setForm((prev) => ({ ...prev, sourceId: order?.id ?? "" }))}
                    getLabel={(order) => `${order.orderNo || order.id} - ${order.party?.name || order.partyName || "No customer"}`}
                    getDetail={(order) => order.status ? `${order.status} / Rs. ${Number(order.total ?? 0).toLocaleString("en-IN")}` : ""}
                    placeholder="Search open sales orders..."
                    emptyText="No open sales orders found"
                    buttonClassName="h-11 rounded-xl bg-background"
                  />
                </Field>
                <Field label="Customer">
                  <input className={inputClass} value={selectedOrder?.party?.name || selectedOrder?.partyName || ""} readOnly placeholder="Auto-filled from sales order" />
                </Field>
                <Field label="Dispatch Date">
                  <DualDateInput ref={dateRef} value={form.date} onChange={(date) => setForm({ ...form, date })} accentColor="bg-orange-600" />
                </Field>
              </div>
              {selectedOrder && (
                <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-4">
                  <div><div className={labelClass}>Sales Order</div><div className="font-bold">{selectedOrder.orderNo || "-"}</div></div>
                  <div><div className={labelClass}>Customer</div><div className="font-bold">{selectedOrder.party?.name || selectedOrder.partyName || "-"}</div></div>
                  <div><div className={labelClass}>Status</div><div className="font-bold capitalize">{selectedOrder.status || "-"}</div></div>
                  <div><div className={labelClass}>Total</div><MoneyText value={Number(selectedOrder.total ?? 0)} className="font-bold" /></div>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3">Item</th>
                      <th className="px-3 py-3 text-right">Dispatch Qty</th>
                      <th className="px-3 py-3 text-right">Rate</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="w-12 px-3 py-3 text-right" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dispatchLines.length ? dispatchLines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-3 font-bold">{line.itemName}</td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" step="0.01" className={cn(inputClass, "ml-auto w-28 text-right")} value={line.qty} onChange={(e) => setDispatchLines((prev) => prev.map((row) => row.id === line.id ? { ...row, qty: Number(e.target.value) || 0 } : row))} />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <input type="number" min="0" step="0.01" className={cn(inputClass, "ml-auto w-28 text-right")} value={line.rate} onChange={(e) => setDispatchLines((prev) => prev.map((row) => row.id === line.id ? { ...row, rate: Number(e.target.value) || 0 } : row))} />
                        </td>
                        <td className="px-3 py-3 text-right"><MoneyText value={line.qty * line.rate} className="font-bold" /></td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" onClick={() => setDispatchLines((prev) => prev.filter((row) => row.id !== line.id))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10" title="Remove row">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>Select a sales order to auto-populate dispatch items.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Warehouse">
                  <select className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value, binId: "" })}>
                    <option value="">No warehouse</option>
                    {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                </Field>
                <Field label="Bin">
                  <select className={inputClass} value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })}>
                    <option value="">No bin</option>
                    {bins.map((bin: any) => <option key={bin.id} value={bin.id}>{bin.name}</option>)}
                  </select>
                </Field>
                <Field label="Memo">
                  <input className={inputClass} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="Delivery note, vehicle no, remarks" />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button disabled={saving || !dispatchLines.length} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {saving ? "Posting..." : "Post Dispatch"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">Dispatch Register</h2>
                <p className="text-sm text-muted-foreground">Review all posted delivery dispatches and create new dispatch entries.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className={cn(inputClass, "w-full sm:w-72")} value={dispatchSearch} onChange={(e) => setDispatchSearch(e.target.value)} placeholder="Search dispatch, order, customer, item..." />
                <Button variant="outline" type="button" onClick={refresh} disabled={loading}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
            {dispatches.length ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Dispatch</th>
                      <th className="px-3 py-3">Sales Order</th>
                      <th className="px-3 py-3">Customer</th>
                      <th className="px-3 py-3 text-right">Items</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dispatches.map((dispatch) => (
                      <tr key={dispatch.id} className="align-top">
                        <td className="px-3 py-3 font-medium">{toDateInputValue(dispatch.date) || "-"}</td>
                        <td className="px-3 py-3 font-bold">{dispatch.dispatchNo || `DS-${dispatch.id.slice(0, 8).toUpperCase()}`}</td>
                        <td className="px-3 py-3 font-medium">{dispatch.salesOrderNo || "-"}</td>
                        <td className="px-3 py-3">{dispatch.customerName || "-"}</td>
                        <td className="px-3 py-3 text-right">{dispatch.lineCount}</td>
                        <td className="px-3 py-3 text-right font-bold">{Number(dispatch.totalQty || 0)}</td>
                        <td className="px-3 py-3 text-right"><MoneyText value={Number(dispatch.totalAmount || 0)} className="font-bold" /></td>
                        <td className="px-3 py-3">
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold capitalize text-emerald-600 dark:text-emerald-300">
                            {dispatch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text={loading ? "Loading dispatches..." : "No dispatches posted yet."} />
            )}
          </CardContent>
        </Card>
      )}
    </WorkflowShell>
  );
}

export function ReservationsWorkflowPage() {
  const [view, setView] = React.useState<"register" | "create">("register");
  const [rows, setRows] = React.useState<StockReservationRecord[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [salesOrderId, setSalesOrderId] = React.useState("");
  const [status, setStatus] = React.useState<Status>(null);
  const [loading, setLoading] = React.useState(false);

  const selectedOrder = orders.find((order) => order.id === salesOrderId);
  const orderOptions = React.useMemo(
    () => orders.map((order) => ({
      value: order.id,
      label: `${order.orderNo || order.id} - ${order.party?.name || order.partyName || "No customer"}`,
      meta: order.status ? String(order.status).toUpperCase() : undefined
    })),
    [orders]
  );
  const totals = React.useMemo(() => rows.reduce((acc, row) => {
    acc.reserved += Number(row.reservedQty ?? 0);
    acc.open += Number(row.openQty ?? (Number(row.reservedQty ?? 0) - Number(row.releasedQty ?? 0) - Number(row.fulfilledQty ?? 0)));
    acc.fulfilled += Number(row.fulfilledQty ?? 0);
    return acc;
  }, { reserved: 0, open: 0, fulfilled: 0 }), [rows]);
  const statusLabel = (value: string) => value === "active" ? "Reserved" : value;

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [reservationRows, orderRows] = await Promise.all([
        listStockReservations({ take: 500 }),
        listSalesOrders({ status: "open", take: 100 }).then(normalizeOrders)
      ]);
      setRows(reservationRows);
      setOrders(orderRows);
      setSalesOrderId((current) => current || orderRows[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const reserve = async () => {
    setStatus(null);
    if (!salesOrderId.trim()) return setStatus({ type: "error", message: "Enter a sales order ID." });
    try {
      await reserveSalesOrderStock({ salesOrderId: salesOrderId.trim() });
      setStatus({ type: "success", message: "Sales order stock reserved." });
      setSalesOrderId("");
      setView("register");
      refresh();
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to reserve sales order stock." });
    }
  };

  const release = async (id: string) => {
    await releaseStockReservation(id);
    refresh();
  };

  return (
    <WorkflowShell
      title="Stock Reservations"
      description={view === "create" ? "Reserve available stock against an open sales order." : "Review sales order stock reservations and open reserved quantities."}
      icon={ShoppingCart}
      actions={
        <div className="flex flex-wrap gap-2">
          <RefreshButton loading={loading} onClick={refresh} />
          {view === "register" ? (
            <Button onClick={() => { setStatus(null); setView("create"); }} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> New Reservation
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setView("register")}>Back to Registry</Button>
          )}
        </div>
      }
    >
      {view === "create" && <Card>
        <CardContent className="space-y-4 pt-6">
          <StatusMessage status={status} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <SearchableSelect
              options={orderOptions}
              value={salesOrderId}
              onChange={setSalesOrderId}
              placeholder="Search open sales order..."
              emptyText="No open sales orders found"
            />
            <Button onClick={reserve} className="bg-emerald-600 text-white hover:bg-emerald-700">Reserve Sales Order</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4"><div className={labelClass}>Reserved Qty</div><div className="mt-1 text-2xl font-black">{totals.reserved}</div></div>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4"><div className={labelClass}>Open Reserved</div><div className="mt-1 text-2xl font-black text-orange-500">{totals.open}</div></div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"><div className={labelClass}>Fulfilled</div><div className="mt-1 text-2xl font-black text-emerald-500">{totals.fulfilled}</div></div>
          </div>
          {selectedOrder ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div><div className={labelClass}>Sales Order</div><div className="font-bold">{selectedOrder.orderNo || "-"}</div></div>
                <div><div className={labelClass}>Customer</div><div className="font-bold">{selectedOrder.party?.name || selectedOrder.partyName || "-"}</div></div>
                <div><div className={labelClass}>Status</div><div className="font-bold capitalize">{selectedOrder.status || "-"}</div></div>
                <div><div className={labelClass}>Total</div><MoneyText value={Number(selectedOrder.total ?? 0)} className="font-bold" /></div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr><th className="py-2">Item</th><th className="py-2">Ordered</th><th className="py-2">Fulfilled</th><th className="py-2">Pending</th><th className="py-2 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(selectedOrder.items ?? []).map((line: any) => {
                      const ordered = Number(line.qty ?? 0);
                      const fulfilled = Number(line.fulfilledQty ?? 0);
                      return (
                        <tr key={line.id}>
                          <td className="py-2 font-medium">{line.item?.name || line.description || line.itemId || "-"}</td>
                          <td className="py-2">{ordered}</td>
                          <td className="py-2">{fulfilled}</td>
                          <td className="py-2 font-bold">{Math.max(ordered - fulfilled, 0)}</td>
                          <td className="py-2 text-right"><MoneyText value={Number(line.amount ?? ordered * Number(line.rate ?? 0))} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState text="No open sales orders found for reservation." />
          )}
        </CardContent>
      </Card>}
      {view === "register" && <>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className={labelClass}>Reserved Qty</div><div className="mt-1 text-2xl font-black">{totals.reserved}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className={labelClass}>Open Reserved</div><div className="mt-1 text-2xl font-black text-orange-500">{totals.open}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className={labelClass}>Fulfilled</div><div className="mt-1 text-2xl font-black text-emerald-500">{totals.fulfilled}</div></CardContent></Card>
      </div>
      <SimpleTable
        columns={["Sales Order", "Customer", "Item / SKU", "Reserved", "Open", "Fulfilled", "Status", "Action"]}
        rows={rows.map((row) => [
          row.salesOrderNo || row.salesOrderId || "-",
          row.customerName || "-",
          <div key={`${row.id}-item`}><div className="font-bold">{row.itemName || row.itemId}</div><div className="text-xs text-muted-foreground">{row.sku || "-"} {row.unit ? `/ ${row.unit}` : ""}</div></div>,
          row.reservedQty,
          Number(row.openQty ?? (Number(row.reservedQty ?? 0) - Number(row.releasedQty ?? 0) - Number(row.fulfilledQty ?? 0))),
          row.fulfilledQty,
          <span key={`${row.id}-status`} className={cn("rounded-full px-2 py-1 text-xs font-bold capitalize", row.status === "fulfilled" ? "bg-emerald-500/10 text-emerald-500" : row.status === "released" ? "bg-red-500/10 text-red-500" : row.status === "partial" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500")}>{statusLabel(row.status)}</span>,
          row.status === "active" || row.status === "partial"
            ? <button className="text-xs font-bold text-red-500 hover:underline" onClick={() => release(row.id)}>Release</button>
            : "-"
        ])}
        empty="No reservations found."
      />
      </>}
    </WorkflowShell>
  );
}

export function ReorderWorkflowPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({});
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const nextRows = await getReorderSuggestions();
      setRows(nextRows);
      setSelectedIds(new Set(nextRows.map((row: any) => row.id).filter(Boolean)));
      setQtyById(Object.fromEntries(nextRows.map((row: any) => [row.id, Number(row.suggestedQty ?? 0)]).filter(([id]) => Boolean(id))));
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  const selectedRows = React.useMemo(() => rows.filter((row) => selectedIds.has(row.id)), [rows, selectedIds]);

  const createPurchaseOrderDraft = (selectedRows: any[]) => {
    setStatus(null);
    const lines = selectedRows
      .filter((row) => row.id && Number(qtyById[row.id] ?? row.suggestedQty ?? 0) > 0)
      .map((row) => ({
        itemId: row.id,
        name: row.name,
        sku: row.sku ?? null,
        unit: row.unit ?? null,
        qty: Number(qtyById[row.id] ?? row.suggestedQty ?? 0),
        rate: Number(row.purchasePrice ?? row.closingPrice ?? 0),
        availableQty: Number(row.availableQty ?? 0),
        reorderLevel: Number(row.reorderLevel ?? 0),
        pendingPurchaseQty: Number(row.pendingPurchaseQty ?? 0)
      }));
    if (!lines.length) {
      setStatus({ type: "error", message: "No reorder lines are available to create a purchase order." });
      return;
    }
    window.localStorage.setItem(REORDER_PO_DRAFT_KEY, JSON.stringify({
      source: "reorder-suggestions",
      createdAt: new Date().toISOString(),
      lines
    }));
    window.location.href = "/purchase-orders/create?source=reorder";
  };

  return (
    <WorkflowShell
      title="Reorder Suggestions"
      description="Items below reorder level with suggested purchase quantities."
      icon={PackageSearch}
      actions={
        <div className="flex flex-wrap gap-2">
          <RefreshButton loading={loading} onClick={refresh} />
          <Button disabled={!selectedRows.length} onClick={() => createPurchaseOrderDraft(selectedRows)} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Create Purchase Order ({selectedRows.length})
          </Button>
        </div>
      }
    >
      <StatusMessage status={status} />
      <SimpleTable
        columns={["Select", "Item", "SKU", "Available", "On PO", "Reorder Level", "Shortage", "Order Qty", "Rate", "Value", "Action"]}
        rows={rows.map((row) => [
          <input
            key={`${row.id}-select`}
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={(event) => setSelectedIds((current) => {
              const next = new Set(current);
              if (event.target.checked) next.add(row.id);
              else next.delete(row.id);
              return next;
            })}
            className="h-4 w-4 rounded border-border"
          />,
          row.name,
          row.sku || "-",
          row.availableQty,
          row.pendingPurchaseQty ?? 0,
          row.reorderLevel,
          row.shortageQty ?? row.suggestedQty,
          <input
            key={`${row.id}-qty`}
            type="number"
            min="0"
            step="0.01"
            value={qtyById[row.id] ?? row.suggestedQty ?? 0}
            onChange={(event) => setQtyById((current) => ({ ...current, [row.id]: Number(event.target.value || 0) }))}
            className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-right text-sm"
          />,
          <MoneyText key={`${row.id}-rate`} value={Number(row.purchasePrice || row.closingPrice || 0)} />,
          <MoneyText key={`${row.id}-value`} value={Number(qtyById[row.id] ?? row.suggestedQty ?? 0) * (row.purchasePrice || row.closingPrice || 0)} />,
          <button key={`${row.id}-action`} className="text-xs font-bold text-emerald-500 hover:underline" onClick={() => createPurchaseOrderDraft([row])}>Create PO</button>
        ])}
        empty="No reorder suggestions. Set Reorder Level or Safety Stock on items, then refresh."
      />
    </WorkflowShell>
  );
}

export function ApprovalsWorkflowPage() {
  const [rows, setRows] = React.useState<InventoryMovementApproval[]>([]);
  const [status, setStatus] = React.useState<Status>(null);
  const [loading, setLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected" | "reversed">("pending");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "adjustment" | "transfer">("all");
  const [reasonDraft, setReasonDraft] = React.useState<Record<string, string>>({});

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listInventoryMovementApprovals({
        status: statusFilter === "all" ? undefined : statusFilter,
        movementType: typeFilter === "all" ? undefined : typeFilter,
        take: 200
      }));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);
  React.useEffect(() => { refresh(); }, [refresh]);

  const act = async (id: string, action: "approve" | "reject" | "reverse") => {
    setStatus(null);
    try {
      const reason = reasonDraft[id]?.trim() || undefined;
      if (action === "approve") await approveInventoryMovement(id, { reason });
      if (action === "reject") await rejectInventoryMovement(id, { reason });
      if (action === "reverse") await reverseInventoryMovement(id, { reason });
      setStatus({ type: "success", message: `Movement ${action}d.` });
      setReasonDraft((current) => ({ ...current, [id]: "" }));
      refresh();
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to update movement approval." });
    }
  };

  const formatPayload = (payload: unknown) => {
    const data = (payload && typeof payload === "object" ? payload : {}) as Record<string, any>;
    const shortId = (value?: string | null) => value ? `${String(value).slice(0, 8)}...` : null;
    const itemLabel = data.itemName
      ? `${data.itemName}${data.itemSku ? ` [${data.itemSku}]` : ""}`
      : shortId(data.itemId) || "-";
    const qty = data.qty ?? data.quantity ?? "-";
    const rate = data.rate ?? data.unitCost ?? null;
    const date = data.dateBs || data.date || "-";
    const location = [data.warehouseName || data.fromWarehouseName || shortId(data.warehouseId || data.fromWarehouseId), data.binName || data.fromBinName || shortId(data.binId || data.fromBinId)].filter(Boolean).join(" / ") || "-";
    const destination = [data.toWarehouseName || shortId(data.toWarehouseId), data.toBinName || shortId(data.toBinId)].filter(Boolean).join(" / ") || null;
    const tracking = [data.batchNo && `Batch ${data.batchNo}`, data.lotNo && `Lot ${data.lotNo}`, (data.expiryDateBs || data.expiryDate) && `Exp ${data.expiryDateBs || data.expiryDate}`].filter(Boolean).join(" | ");
    return { data, itemLabel, qty, rate, date, location, destination, tracking };
  };

  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <WorkflowShell
      title="Movement Approvals"
      description="Approve, reject, and reverse stock adjustment or transfer requests."
      icon={ShieldCheck}
      actions={<RefreshButton loading={loading} onClick={refresh} />}
    >
      <StatusMessage status={status} />
      <div className="grid gap-3 md:grid-cols-4">
        {(["pending", "approved", "rejected", "reversed"] as const).map((key) => (
          <Card key={key}><CardContent className="p-4"><div className={labelClass}>{key}</div><div className="mt-1 text-2xl font-black">{counts[key] ?? 0}</div></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Status">
            <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="reversed">Reversed</option>
            </select>
          </Field>
          <Field label="Movement Type">
            <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="all">All movements</option>
              <option value="adjustment">Adjustments</option>
              <option value="transfer">Transfers</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="h-11" onClick={() => { setStatusFilter("pending"); setTypeFilter("all"); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {rows.length ? rows.map((row) => {
          const payload = formatPayload(row.payloadJson);
          return (
            <Card key={row.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black capitalize">{row.movementType}</span>
                      <StatusBadge value={row.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Requested {row.requestedAt ? toDateInputValue(row.requestedAt) : "-"}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {row.postedVoucherId ? <div>Posted voucher: <span className="font-mono">{row.postedVoucherId}</span></div> : null}
                    {row.reversalVoucherId ? <div>Reversal voucher: <span className="font-mono">{row.reversalVoucherId}</span></div> : null}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <div><div className={labelClass}>Item</div><div className="font-bold">{payload.itemLabel}</div></div>
                  <div><div className={labelClass}>Qty</div><div className="font-bold">{payload.qty}</div></div>
                  <div><div className={labelClass}>Rate</div><div className="font-bold">{payload.rate != null ? <MoneyText value={Number(payload.rate)} /> : "-"}</div></div>
                  <div><div className={labelClass}>Date</div><div className="font-bold">{String(payload.date).slice(0, 10)}</div></div>
                  <div><div className={labelClass}>{payload.destination ? "From / To" : "Location"}</div><div className="font-bold">{payload.destination ? `${payload.location} -> ${payload.destination}` : payload.location}</div></div>
                </div>
                {payload.tracking ? <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{payload.tracking}</div> : null}
                {row.reason ? <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm"><span className="font-bold">Reason:</span> {row.reason}</div> : null}
                {(row.status === "pending" || row.status === "approved") ? (
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input className={inputClass} value={reasonDraft[row.id] ?? ""} onChange={(e) => setReasonDraft((current) => ({ ...current, [row.id]: e.target.value }))} placeholder={row.status === "pending" ? "Approval/rejection note" : "Reversal reason"} />
                    <div className="flex flex-wrap gap-2">
                      {row.status === "pending" && <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => act(row.id, "approve")}><BadgeCheck className="mr-2 h-4 w-4" />Approve</Button>}
                      {row.status === "pending" && <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => act(row.id, "reject")}><XCircle className="mr-2 h-4 w-4" />Reject</Button>}
                      {row.status === "approved" && <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" onClick={() => act(row.id, "reverse")}><RotateCcw className="mr-2 h-4 w-4" />Reverse</Button>}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        }) : <EmptyState text={loading ? "Loading movement approvals..." : "No movement approval requests found."} />}
      </div>
    </WorkflowShell>
  );
}

export function PeriodCloseWorkflowPage() {
  const [rows, setRows] = React.useState<InventoryPeriodClose[]>([]);
  const [status, setStatus] = React.useState<Status>(null);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ from: "", to: new Date().toISOString().slice(0, 10) });
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listInventoryPeriodCloses({ take: 100 }));
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);

  const close = async () => {
    setStatus(null);
    if (!form.from || !form.to) return setStatus({ type: "error", message: "Select both period dates." });
    try {
      await closeInventoryPeriod({ periodFrom: form.from, periodTo: form.to });
      setStatus({ type: "success", message: "Inventory period closed and valuation snapshot saved." });
      refresh();
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message ?? "Unable to close inventory period." });
    }
  };

  return (
    <WorkflowShell title="Inventory Period Close" description="Save valuation snapshots for month-end or year-end inventory reporting." icon={CalendarCheck} actions={<RefreshButton loading={loading} onClick={refresh} />}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <StatusMessage status={status} />
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Period From"><input type="date" className={inputClass} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></Field>
            <Field label="Period To"><input type="date" className={inputClass} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
            <div className="flex items-end"><Button onClick={close} className="h-11 bg-emerald-600 text-white hover:bg-emerald-700">Close Period</Button></div>
          </div>
        </CardContent>
      </Card>
      <SimpleTable
        columns={["From", "To", "Status", "Costing", "Qty", "Value"]}
        rows={rows.map((row) => [toDateInputValue(row.periodFrom), toDateInputValue(row.periodTo), row.status, row.costingMethod || "-", row.totalQty, <MoneyText key={row.id} value={row.totalValue} />])}
        empty="No inventory periods closed yet."
      />
    </WorkflowShell>
  );
}

export function BatchLotWorkflowPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listBatchLotMaster({ includeZero: false, take: 500 }));
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);

  return (
    <WorkflowShell title="Batch & Lot Master" description="Selectable tracked stock by item, warehouse, bin, batch, lot, and expiry." icon={PackageSearch} actions={<RefreshButton loading={loading} onClick={refresh} />}>
      <SimpleTable
        columns={["Item", "Warehouse", "Bin", "Batch No", "Lot No", "Expiry", "Qty", "Value"]}
        rows={rows.map((row, index) => [
          row.itemName || row.itemId || "-",
          row.warehouseName || row.warehouseId || "-",
          row.binName || row.binId || "-",
          row.batchNo || "-",
          row.lotNo || "-",
          toDateInputValue(row.expiryDate) || row.expiryDateBs || "-",
          row.currentQty ?? row.qty ?? 0,
          <MoneyText key={row.id || index} value={row.value ?? 0} />
        ])}
        empty="No tracked batch or lot stock found."
      />
    </WorkflowShell>
  );
}

function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
      Refresh
    </Button>
  );
}

function StatusBadge({ value }: { value: string }) {
  const classes: Record<string, string> = {
    pending: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    rejected: "border-red-500/40 bg-red-500/10 text-red-600",
    reversed: "border-orange-500/40 bg-orange-500/10 text-orange-600"
  };
  return <span className={cn("rounded-full border px-2 py-1 text-xs font-bold capitalize", classes[value] ?? "border-border text-muted-foreground")}>{value}</span>;
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {rows.length === 0 ? <div className="p-4"><EmptyState text={empty} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-bold">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/30">
                    {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-middle">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
