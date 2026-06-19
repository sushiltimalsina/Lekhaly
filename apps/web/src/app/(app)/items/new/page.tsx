"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { createItem, getItem, listItems, updateItem } from "@/lib/api/items";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listTaxes } from "@/lib/api/taxes";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listUnits, type UnitRecord } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { listWarehouses, type Warehouse, type WarehouseBin } from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { hasItemPolicyTracking, inventoryFeatures } from "@/lib/inventory-features";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PackagePlus, Save, Plus, X, Layers,
  ShieldCheck, AlertTriangle, Package, BookOpen, DollarSign
} from "lucide-react";
import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";
import SearchableSelect from "@/components/app/searchable-select";
import DualDateInput from "@/components/app/dual-date-input";
import AddWarehouseDialog from "@/components/app/add-warehouse-dialog";

type ItemType = "goods" | "services";
type TaxCode = { id: string; name: string; rate: number };
type SimpleItem = { id: string; name: string; sku?: string; unit?: string };
type BomLine = { componentId: string; componentName: string; qty: number };

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [taxable, setTaxable] = React.useState(false);
  const [taxes, setTaxes] = React.useState<TaxCode[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [allItems, setAllItems] = React.useState<SimpleItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [addUnitOpen, setAddUnitOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [addWarehouseOpen, setAddWarehouseOpen] = React.useState(false);
  const [addBinOpen, setAddBinOpen] = React.useState(false);

  // BOM builder state
  const [bomLines, setBomLines] = React.useState<BomLine[]>([]);
  const [bomSearch, setBomSearch] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    sku: "",
    hsCode: "",
    unit: "",
    type: "goods" as ItemType,
    salesPrice: "",
    purchasePrice: "",
    openingQty: "",
    openingPrice: "",
    groupId: "",
    incomeAccountId: "",
    expenseAccountId: "",
    taxCodeIds: [] as string[],
    // New fields
    minStockLevel: "",
    reorderQty: "",
    trackInventory: true,
    isSerialized: false,
    isKit: false,
    tracksBatch: false,
    tracksLot: false,
    tracksExpiry: false,
    defaultWarehouseId: "",
    defaultBinId: "",
    defaultBatchNo: "",
    defaultLotNo: "",
    defaultExpiryDate: "",
    defaultExpiryDateBs: "",
  });

  React.useEffect(() => {
    listTaxes({ take: 100 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setTaxes(
        Array.isArray(data)
          ? data.filter((t: any) => t?.id).map((t: any) => ({ id: t.id, name: String(t.name), rate: Number(t.rate ?? 0) }))
          : []
      );
    }).catch(() => setTaxes([]));

    listAccounts({ isActive: true, take: 1000 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.accounts ?? res?.items ?? res?.data ?? [];
      setAccounts(Array.isArray(data) ? data.filter((a: any) => a?.id && a.isPostable !== false) : []);
    }).catch(() => setAccounts([]));

    listUnits({ take: 1000 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setUnits(
        Array.isArray(data)
          ? data.filter((u: any) => u?.id).map((u: any) => ({ id: u.id, name: String(u.name) }))
          : []
      );
    }).catch(() => setUnits([]));

    listItemGroups({ take: 1000 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setGroups(
        Array.isArray(data)
          ? data.filter((g: any) => g?.id).map((g: any) => ({ id: g.id, name: String(g.name) }))
          : []
      );
    }).catch(() => setGroups([]));

    listItems({ take: 500 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setAllItems(
        Array.isArray(data)
          ? data.filter((i: any) => i?.id).map((i: any) => ({ id: i.id, name: String(i.name), sku: i.sku, unit: i.unit }))
          : []
      );
    }).catch(() => setAllItems([]));

    getInventorySettings().then(setInventorySettings).catch(() => setInventorySettings(null));
    listWarehouses({ isActive: true }).then((res: any) => {
      setWarehouses(Array.isArray(res) ? res : res?.items ?? res?.data ?? []);
    }).catch(() => setWarehouses([]));
  }, []);

  React.useEffect(() => {
    if (!editId) return;
    getItem(editId).then((item: any) => {
      setForm((prev) => ({
        ...prev,
        name: item.name ?? "",
        sku: item.sku ?? "",
        hsCode: item.hsCode ?? "",
        unit: item.unit ?? "",
        type: item.type === "services" ? "services" : "goods",
        salesPrice: item.salesPrice != null ? String(item.salesPrice) : "",
        purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
        openingQty: "",
        openingPrice: "",
        groupId: item.groupId ?? "",
        incomeAccountId: item.incomeAccountId ?? "",
        expenseAccountId: item.expenseAccountId ?? "",
        taxCodeIds: Array.isArray(item.taxCodeIds) ? item.taxCodeIds : [],
        minStockLevel: item.minStockLevel != null ? String(item.minStockLevel) : item.reorderLevel != null ? String(item.reorderLevel) : "",
        reorderQty: item.reorderQty != null ? String(item.reorderQty) : "",
        trackInventory: item.trackInventory !== false,
        isSerialized: Boolean(item.isSerialized),
        isKit: Boolean(item.isKit),
        tracksBatch: Boolean(item.tracksBatch),
        tracksLot: Boolean(item.tracksLot),
        tracksExpiry: Boolean(item.tracksExpiry),
        defaultWarehouseId: item.defaultWarehouseId ?? "",
        defaultBinId: item.defaultBinId ?? "",
        defaultBatchNo: item.defaultBatchNo ?? "",
        defaultLotNo: item.defaultLotNo ?? "",
        defaultExpiryDate: item.defaultExpiryDate ? String(item.defaultExpiryDate).split("T")[0] : "",
        defaultExpiryDateBs: item.defaultExpiryDateBs ?? "",
      }));
      setTaxable(Array.isArray(item.taxCodeIds) && item.taxCodeIds.length > 0);
      if (Array.isArray(item.components)) {
        setBomLines(item.components.map((component: any) => ({
          componentId: component.componentId,
          componentName: component.component?.name || component.componentName || component.name || "Component",
          qty: Number(component.qty ?? 1),
        })));
      }
    }).catch((err: any) => setError(err?.message ?? "Failed to load item for editing."));
  }, [editId]);

  const update = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addBomLine = (item: SimpleItem) => {
    if (bomLines.find((l) => l.componentId === item.id)) return;
    setBomLines((prev) => [...prev, { componentId: item.id, componentName: item.name, qty: 1 }]);
    setBomSearch("");
  };

  const removeBomLine = (id: string) => {
    setBomLines((prev) => prev.filter((l) => l.componentId !== id));
  };

  const updateBomQty = (id: string, qty: number) => {
    setBomLines((prev) => prev.map((l) => l.componentId === id ? { ...l, qty } : l));
  };

  const filteredBomItems = allItems.filter((i) => {
    const q = bomSearch.toLowerCase();
    return (
      !bomLines.find((l) => l.componentId === i.id) &&
      (i.name.toLowerCase().includes(q) || (i.sku || "").toLowerCase().includes(q))
    );
  }).slice(0, 8);

  const features = inventoryFeatures(inventorySettings);
  const goodsInventoryEnabled = form.type === "goods" && features.inventory;
  const effectiveTrackInventory = goodsInventoryEnabled && form.trackInventory;
  const showOpeningStock = effectiveTrackInventory;
  const showAdvancedPolicies = hasItemPolicyTracking(features);
  const selectedDefaultWarehouse = warehouses.find((warehouse) => warehouse.id === form.defaultWarehouseId);
  const defaultBins = selectedDefaultWarehouse?.bins ?? [];
  const incomeAccountOptions = [{ id: "", name: "Auto / no sales income account", code: "", type: "income" }, ...accounts.filter((account) => account.type === "income")];
  const expenseAccountOptions = [{ id: "", name: "Auto / no purchase or COGS account", code: "", type: "expense" }, ...accounts.filter((account) => account.type === "expense" || account.type === "asset")];
  const accountLabel = (account: any) => [account.code, account.name, account.type ? `(${account.type})` : ""].filter(Boolean).join(" ");
  const addWarehouseRecord = (warehouse: Warehouse) => {
    setWarehouses((prev) => [...prev.filter((row) => row.id !== warehouse.id), { ...warehouse, bins: warehouse.bins ?? [] }]);
    setForm((prev) => ({ ...prev, defaultWarehouseId: warehouse.id, defaultBinId: "" }));
  };
  const addBinRecord = (bin: WarehouseBin) => {
    setWarehouses((prev) => prev.map((warehouse) => warehouse.id === bin.warehouseId ? { ...warehouse, bins: [...(warehouse.bins ?? []).filter((row) => row.id !== bin.id), bin] } : warehouse));
    setForm((prev) => ({ ...prev, defaultBinId: bin.id }));
  };

  React.useEffect(() => {
    if (!inventorySettings) return;
    setForm((prev) => {
      const next = { ...prev };
      if (prev.type === "services" || !features.inventory) {
        next.trackInventory = false;
        next.minStockLevel = "";
        next.reorderQty = "";
        next.openingQty = "";
        next.openingPrice = "";
      }
      if (!next.trackInventory || !features.serial) next.isSerialized = false;
      if (!next.trackInventory || !features.batch) next.tracksBatch = false;
      if (!next.trackInventory || !features.lot) next.tracksLot = false;
      if (!next.trackInventory || !features.expiry) next.tracksExpiry = false;
      if (!features.warehouses) {
        next.defaultWarehouseId = "";
        next.defaultBinId = "";
      } else if (!next.defaultWarehouseId && inventorySettings.defaultWarehouseId) {
        next.defaultWarehouseId = inventorySettings.defaultWarehouseId;
      }
      if (!features.bins) next.defaultBinId = "";
      if (!next.trackInventory || !features.batch || !next.tracksBatch) next.defaultBatchNo = "";
      if (!next.trackInventory || !features.lot || !next.tracksLot) next.defaultLotNo = "";
      if (!next.trackInventory || !features.expiry || !next.tracksExpiry) {
        next.defaultExpiryDate = "";
        next.defaultExpiryDateBs = "";
      }
      if (prev.type === "services" || !features.kits) next.isKit = false;
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [inventorySettings, features.inventory, features.serial, features.batch, features.lot, features.expiry, features.kits, form.type]);

  React.useEffect(() => {
    if (!features.kits || !form.isKit) setBomLines([]);
  }, [features.kits, form.isKit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim()) { setError("Item name is required."); return; }
    if (features.kits && form.isKit && bomLines.length === 0) { setError("A kit item must have at least one component."); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        hsCode: form.hsCode.trim() || undefined,
        unit: form.unit.trim() || undefined,
        type: form.type,
        salesPrice: form.salesPrice ? Number(form.salesPrice) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        openingQty: !isEditMode && showOpeningStock && form.openingQty ? Number(form.openingQty) : undefined,
        openingPrice: !isEditMode && showOpeningStock && form.openingPrice ? Number(form.openingPrice) : undefined,
        groupId: form.groupId || undefined,
        incomeAccountId: form.incomeAccountId.trim() || undefined,
        expenseAccountId: form.expenseAccountId.trim() || undefined,
        taxCodeIds: taxable ? form.taxCodeIds : undefined,
        minStockLevel: effectiveTrackInventory && form.minStockLevel ? Number(form.minStockLevel) : undefined,
        reorderQty: effectiveTrackInventory && form.reorderQty ? Number(form.reorderQty) : undefined,
        trackInventory: effectiveTrackInventory,
        isSerialized: effectiveTrackInventory && features.serial ? form.isSerialized : false,
        isKit: form.type === "goods" && features.kits ? form.isKit : false,
        tracksBatch: effectiveTrackInventory && features.batch ? form.tracksBatch : false,
        tracksLot: effectiveTrackInventory && features.lot ? form.tracksLot : false,
        tracksExpiry: effectiveTrackInventory && features.expiry ? form.tracksExpiry : false,
        defaultWarehouseId: effectiveTrackInventory && features.warehouses ? form.defaultWarehouseId || undefined : undefined,
        defaultBinId: effectiveTrackInventory && features.bins ? form.defaultBinId || undefined : undefined,
        defaultBatchNo: effectiveTrackInventory && features.batch && form.tracksBatch ? form.defaultBatchNo.trim() || undefined : undefined,
        defaultLotNo: effectiveTrackInventory && features.lot && form.tracksLot ? form.defaultLotNo.trim() || undefined : undefined,
        defaultExpiryDate: effectiveTrackInventory && features.expiry && form.tracksExpiry ? form.defaultExpiryDate || undefined : undefined,
        defaultExpiryDateBs: effectiveTrackInventory && features.expiry && form.tracksExpiry ? form.defaultExpiryDateBs || undefined : undefined,
        components: features.kits && form.isKit
          ? bomLines.map((l) => ({ componentId: l.componentId, qty: l.qty }))
          : undefined,
      } as any;
      if (editId) {
        await updateItem(editId, payload);
        setSuccess("Item updated successfully!");
        setTimeout(() => router.push(`/items/${editId}`), 600);
      } else {
        await createItem(payload);
        setSuccess("Item created successfully!");
        setTimeout(() => router.push("/items"), 600);
      }
    } catch (err: any) {
      setError(err?.message ?? (isEditMode ? "Failed to update item." : "Failed to create item."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-24">
      <PageHeader
        title={isEditMode ? "Edit Item" : "Add New Item"}
        description={isEditMode ? "Update item details, pricing, and inventory policy." : "Create a goods or services item with full inventory and accounting setup."}
        icon={PackagePlus}
        backHref="/items"
        backLabel="Back to Items"
      />

      <form onSubmit={onSubmit} className="space-y-8">
        {/* BASIC INFO */}
        <div className="grid gap-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
              <SectionHeader icon={Package} title="Item Details" desc="Core identification info for this item." />
              <div className="grid gap-4">
                <Field label="Item Name *">
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Premium Ledger Paper" required />
                </Field>
                <Field label="SKU (Unique Code)">
                  <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="e.g. LKH-001" />
                </Field>
                <Field label="HS Code">
                  <Input value={form.hsCode} onChange={(e) => update("hsCode", e.target.value)} placeholder="e.g. 4820.10" />
                </Field>
                <Field label="Group" action={<AddBtn onClick={() => setAddGroupOpen(true)} />}>
                  <SearchableSelect
                    options={[{ id: "", name: "No group" }, ...groups]}
                    valueId={form.groupId}
                    onChange={(id) => update("groupId", id)}
                    placeholder="Search item group..."
                  />
                </Field>
                <Field label="Unit" action={<AddBtn onClick={() => setAddUnitOpen(true)} />}>
                  <SearchableSelect
                    options={[{ id: "", name: "No unit" }, ...units]}
                    valueId={units.find((unit) => unit.name === form.unit)?.id ?? ""}
                    fallbackLabel={form.unit}
                    onChange={(_, unit: any) => update("unit", unit?.name ?? "")}
                    placeholder="Search unit..."
                  />
                </Field>
                <Field label="Item Type">
                  <div className="flex gap-2">
                    {(["goods", "services"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => update("type", t)}
                        className={cn("rounded-xl border px-4 py-2 text-xs font-semibold transition-all", form.type === t ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-background hover:bg-muted")}>
                        {t === "goods" ? "Goods" : "Services"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
          </section>
        </div>

        {/* PRICING */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <SectionHeader icon={DollarSign} title="Pricing & Opening Balance" desc="Set default prices and initial stock values." />
            <div className="grid gap-4">
              <Field label="Sales Price">
                <Input type="number" min="0" step="0.01" value={form.salesPrice} onChange={(e) => update("salesPrice", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Purchase Price">
                <Input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} placeholder="0.00" disabled={form.type === "services"} />
              </Field>
              {showOpeningStock && (
                <>
                  <Field label="Opening Quantity">
                    <Input type="number" min="0" step="0.01" value={form.openingQty} onChange={(e) => update("openingQty", e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="Opening Price / Rate">
                    <Input type="number" min="0" step="0.01" value={form.openingPrice} onChange={(e) => update("openingPrice", e.target.value)} placeholder="0.00" />
                  </Field>
                </>
              )}
            </div>
            {showOpeningStock && Number(form.openingQty) > 0 && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-4 py-3 text-sm">
                Opening Amount: <span className="font-black text-emerald-700 dark:text-emerald-400">{(Number(form.openingQty) * Number(form.openingPrice || 0)).toFixed(2)}</span>
              </div>
            )}
        </section>

        {/* INVENTORY CONTROLS */}
        {features.inventory && (
          <div className="space-y-6">
            {goodsInventoryEnabled && (
              <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                <SectionHeader icon={AlertTriangle} title="Reorder & Low Stock Alerts" desc="Set thresholds to trigger automatic low-stock warnings." />
                <div className="grid gap-4">
                  <Field label="Minimum Stock Level" hint="Alert shows when stock drops below this">
                    <Input type="number" min="0" step="0.01" value={form.minStockLevel} onChange={(e) => update("minStockLevel", e.target.value)} placeholder="e.g. 10" />
                  </Field>
                  <Field label="Reorder Quantity" hint="Suggested qty when creating reorder PO">
                    <Input type="number" min="0" step="0.01" value={form.reorderQty} onChange={(e) => update("reorderQty", e.target.value)} placeholder="e.g. 50" />
                  </Field>
                </div>
              </section>
            )}

            <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
              <SectionHeader icon={ShieldCheck} title="Inventory Policy" desc="Item-level stock behaviour follows company inventory configuration." />
              <div className="flex flex-col gap-4">
                <Toggle
                  id="trackInventory"
                  label="Track Stock"
                  desc="Maintain stock ledger quantities for this goods item."
                  checked={form.trackInventory}
                  onChange={(v) => update("trackInventory", v)}
                  disabled={!goodsInventoryEnabled}
                />
                {showAdvancedPolicies && (
                  <>
                    {features.serial && (
                      <Toggle id="isSerialized" label="Serialized Item" desc="Each unit has a unique serial number tracked from purchase to sale." checked={form.isSerialized} onChange={(v) => update("isSerialized", v)} disabled={!effectiveTrackInventory} />
                    )}
                    {features.batch && (
                      <Toggle id="tracksBatch" label="Batch Tracked" desc="Require batch number when stock moves for this item." checked={form.tracksBatch} onChange={(v) => update("tracksBatch", v)} disabled={!effectiveTrackInventory} />
                    )}
                    {features.lot && (
                      <Toggle id="tracksLot" label="Lot Tracked" desc="Require lot number when stock moves for this item." checked={form.tracksLot} onChange={(v) => update("tracksLot", v)} disabled={!effectiveTrackInventory} />
                    )}
                    {features.expiry && (
                      <Toggle id="tracksExpiry" label="Expiry Tracked" desc="Require expiry date when stock moves for this item." checked={form.tracksExpiry} onChange={(v) => update("tracksExpiry", v)} disabled={!effectiveTrackInventory} />
                    )}
                    {features.kits && (
                      <Toggle id="isKit" label="Kit / Bundle Item" desc="When sold, automatically deducts the component items from stock instead of this item." checked={form.isKit} onChange={(v) => update("isKit", v)} disabled={form.type === "services"} />
                    )}
                  </>
                )}
              </div>
            </section>

            {effectiveTrackInventory && (
              <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                <SectionHeader icon={Package} title="Default Stock Identity" desc="Used on opening stock, adjustment, and transfer forms for this item." />
                <div className="grid gap-4 sm:grid-cols-2">
                  {features.warehouses && (
                    <Field label="Default Warehouse" action={<AddBtn onClick={() => setAddWarehouseOpen(true)} />}>
                      <SearchableSelect
                        options={[{ id: "", name: "No default warehouse" }, ...warehouses]}
                        valueId={form.defaultWarehouseId}
                        onChange={(id) => setForm((prev) => ({ ...prev, defaultWarehouseId: id, defaultBinId: "" }))}
                        placeholder="Search warehouse..."
                      />
                    </Field>
                  )}
                  {features.bins && (
                    <Field label="Default Bin" action={<AddBtn onClick={() => form.defaultWarehouseId && setAddBinOpen(true)} />}>
                      <SearchableSelect
                        options={[{ id: "", name: form.defaultWarehouseId ? "No default bin" : "Choose warehouse first" }, ...defaultBins]}
                        valueId={form.defaultBinId}
                        onChange={(id) => update("defaultBinId", id)}
                        placeholder="Search bin..."
                        disabled={!form.defaultWarehouseId}
                      />
                    </Field>
                  )}
                  {features.batch && form.tracksBatch && (
                    <Field label="Batch No.">
                      <Input value={form.defaultBatchNo} onChange={(e) => update("defaultBatchNo", e.target.value)} placeholder="e.g. BATCH-001" />
                    </Field>
                  )}
                  {features.lot && form.tracksLot && (
                    <Field label="Lot No.">
                      <Input value={form.defaultLotNo} onChange={(e) => update("defaultLotNo", e.target.value)} placeholder="e.g. LOT-001" />
                    </Field>
                  )}
                  {features.expiry && form.tracksExpiry && (
                    <div className="sm:col-span-2">
                      <Field label="Expiry Date">
                        <DualDateInput
                          value={{ ad: form.defaultExpiryDate, bs: form.defaultExpiryDateBs }}
                          onChange={({ ad, bs }) => setForm((prev) => ({ ...prev, defaultExpiryDate: ad, defaultExpiryDateBs: bs }))}
                          accentColor="bg-orange-600"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* BOM Builder */}
            {features.kits && form.isKit && (
              <section className="rounded-2xl border-2 border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800 dark:text-amber-300">Bill of Materials (Kit Components)</h3>
                </div>
                <p className="text-sm text-muted-foreground">Add the items that make up this kit. When 1 unit of this item is sold, the system will deduct the quantities below from stock.</p>

                {/* Search */}
                <div className="relative">
                  <Input
                    value={bomSearch}
                    onChange={(e) => setBomSearch(e.target.value)}
                    placeholder="Search items to add as components..."
                    className="pr-4"
                  />
                  {bomSearch && filteredBomItems.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border bg-background shadow-xl">
                      {filteredBomItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addBomLine(item)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted transition-colors"
                        >
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{item.name}</span>
                          {item.sku && <span className="text-xs text-muted-foreground ml-auto">{item.sku}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOM Lines */}
                {bomLines.length > 0 ? (
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Component Item</th>
                          <th className="text-center px-4 py-2 font-semibold text-muted-foreground w-32">Qty per Unit</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomLines.map((line) => (
                          <tr key={line.componentId} className="border-t">
                            <td className="px-4 py-2 font-medium">{line.componentName}</td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={line.qty}
                                onChange={(e) => updateBomQty(line.componentId, Number(e.target.value))}
                                className="text-center h-8"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button type="button" onClick={() => removeBomLine(line.componentId)} className="text-red-500 hover:text-red-700">
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 py-8 text-center text-sm text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-amber-400 opacity-50" />
                    Search and add component items above to build this kit.
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ACCOUNTING */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <SectionHeader icon={BookOpen} title="Accounting & Tax" desc="Choose how this item posts to sales, purchase, inventory, and tax ledgers." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sales Income Account" hint="Used when this item is sold. Leave auto if you use default sales income posting.">
                <SearchableSelect
                  options={incomeAccountOptions}
                  valueId={form.incomeAccountId}
                  onChange={(id) => update("incomeAccountId", id)}
                  getLabel={accountLabel}
                  getDetail={(account: any) => account.type ? account.type : ""}
                  placeholder="Search income account..."
                />
              </Field>
              <Field label="Purchase / COGS Account" hint="Used for purchase cost, COGS, or inventory asset fallback.">
                <SearchableSelect
                  options={expenseAccountOptions}
                  valueId={form.expenseAccountId}
                  onChange={(id) => update("expenseAccountId", id)}
                  getLabel={accountLabel}
                  getDetail={(account: any) => account.type ? account.type : ""}
                  placeholder="Search purchase or COGS account..."
                  disabled={form.type === "services"}
                />
              </Field>
            </div>
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground font-medium">Tax Configuration</label>
              <div className="flex gap-2">
                {(["non-taxable", "taxable"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { const next = t === "taxable"; setTaxable(next); if (!next) setForm((p) => ({ ...p, taxCodeIds: [] })); }}
                    className={cn("rounded-xl border px-4 py-2 text-xs font-semibold transition-all", taxable === (t === "taxable") ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-background hover:bg-muted")}>
                    {t === "taxable" ? "Taxable" : "Non-taxable"}
                  </button>
                ))}
              </div>
              {taxable && (
                <div className="grid gap-2 rounded-xl border bg-background p-4">
                  {taxes.length ? taxes.map((tax) => {
                    const checked = form.taxCodeIds.includes(tax.id);
                    return (
                      <label key={tax.id} className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-sm">{tax.name} <span className="text-muted-foreground">({tax.rate}%)</span></span>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setForm((prev) => {
                            const next = new Set(prev.taxCodeIds);
                            if (next.has(tax.id)) next.delete(tax.id); else next.add(tax.id);
                            return { ...prev, taxCodeIds: Array.from(next) };
                          });
                        }} className="h-4 w-4 rounded" />
                      </label>
                    );
                  }) : <p className="text-xs text-muted-foreground">No tax codes found.</p>}
                </div>
              )}
            </div>
        </section>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-2xl border bg-background/80 backdrop-blur px-6 py-4 shadow-xl">
          <div>
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700">{success}</div>}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="rounded-2xl h-12 px-6" onClick={() => router.push("/items")}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-2xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : isEditMode ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </div>
      </form>

      <AddUnitDialog open={addUnitOpen} onClose={() => setAddUnitOpen(false)} onSuccess={(unit) => { setUnits((p) => [...p, unit]); update("unit", unit.name); }} />
      <AddGroupDialog open={addGroupOpen} onClose={() => setAddGroupOpen(false)} onSuccess={(group) => { setGroups((p) => [...p, group]); update("groupId", group.id); }} />
      <AddWarehouseDialog open={addWarehouseOpen} onClose={() => setAddWarehouseOpen(false)} onSuccess={(warehouse) => addWarehouseRecord(warehouse as Warehouse)} />
      <AddWarehouseDialog open={addBinOpen} onClose={() => setAddBinOpen(false)} warehouseId={form.defaultWarehouseId || undefined} warehouseName={selectedDefaultWarehouse?.name} onSuccess={(bin) => addBinRecord(bin as WarehouseBin)} />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint, action }: { label: string; children: React.ReactNode; hint?: string; action?: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="flex items-center justify-between text-muted-foreground font-medium">
        {label}
        {action}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-500">
      <Plus className="h-3 w-3" /> Add
    </button>
  );
}

function Toggle({ id, label, desc, checked, onChange, disabled }: { id: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={cn("flex items-start gap-4 rounded-xl border p-4 transition-colors", checked ? "border-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-border bg-background", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex-1">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
          checked ? "bg-emerald-500" : "bg-muted-foreground/30"
        )}
      >
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
