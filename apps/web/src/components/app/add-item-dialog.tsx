"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createItem, type ItemType } from "@/lib/api/items";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listUnits, type UnitRecord } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { listWarehouses, type Warehouse, type WarehouseBin } from "@/lib/api/warehouses";
import { listTaxes } from "@/lib/api/taxes";
import { X, Save, PackagePlus, Info, Banknote, History, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { inventoryFeatures } from "@/lib/inventory-features";
import { createPortal } from "react-dom";
import AddUnitDialog from "./add-unit-dialog";
import AddGroupDialog from "./add-group-dialog";
import SearchableSelect from "./searchable-select";
import DualDateInput from "./dual-date-input";
import AddWarehouseDialog from "./add-warehouse-dialog";

type AddItemDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (item: any) => void;
};

type TaxCode = { id: string; name: string; rate: number };

export default function AddItemDialog({ open, onClose, onSuccess }: AddItemDialogProps) {
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [units, setUnits] = React.useState<UnitRecord[]>([]);
    const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
    const [taxes, setTaxes] = React.useState<TaxCode[]>([]);
    const [taxable, setTaxable] = React.useState(false);
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);

    const [addUnitOpen, setAddUnitOpen] = React.useState(false);
    const [addGroupOpen, setAddGroupOpen] = React.useState(false);
    const [addWarehouseOpen, setAddWarehouseOpen] = React.useState(false);
    const [addBinOpen, setAddBinOpen] = React.useState(false);

    const [form, setForm] = React.useState({
        name: "",
        sku: "",
        hsCode: "",
        unit: "",
        type: "goods" as ItemType,
        salesPrice: "",
        purchasePrice: "",
        reorderLevel: "",
        safetyStock: "",
        openingQty: "",
        openingPrice: "",
        groupId: "",
        incomeAccountId: "",
        expenseAccountId: "",
        taxCodeIds: [] as string[],
        trackInventory: true,
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

    const update = (key: keyof typeof form, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    React.useEffect(() => {
        if (!open) return;

        const normalizeList = <T,>(input: any): T[] => {
            if (Array.isArray(input)) return input;
            return input?.items ?? input?.data ?? [];
        };

        Promise.all([
            listUnits({ take: 100 }),
            listItemGroups({ take: 100 }),
            listTaxes({ take: 100 }),
            getInventorySettings(),
            listWarehouses({ isActive: true })
        ]).then(([u, g, t, inv, wh]: any) => {
            setUnits(normalizeList<UnitRecord>(u));
            setGroups(normalizeList<ItemGroupRecord>(g));
            setTaxes(normalizeList<any>(t).map((item: any) => ({
                id: item.id,
                name: item.name,
                rate: item.rate
            })));
            setInventorySettings(inv);
            setWarehouses(normalizeList<Warehouse>(wh));
        }).catch(() => { });
    }, [open]);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    const features = inventoryFeatures(inventorySettings);
    const showOpeningStock = form.type === "goods" && features.inventory && form.trackInventory;
    const selectedDefaultWarehouse = warehouses.find((warehouse) => warehouse.id === form.defaultWarehouseId);
    const defaultBins = selectedDefaultWarehouse?.bins ?? [];
    const addWarehouseRecord = (warehouse: Warehouse) => {
        setWarehouses((prev) => [...prev.filter((row) => row.id !== warehouse.id), { ...warehouse, bins: warehouse.bins ?? [] }]);
        setForm((prev) => ({ ...prev, defaultWarehouseId: warehouse.id, defaultBinId: "" }));
    };
    const addBinRecord = (bin: WarehouseBin) => {
        setWarehouses((prev) => prev.map((warehouse) => warehouse.id === bin.warehouseId ? { ...warehouse, bins: [...(warehouse.bins ?? []).filter((row) => row.id !== bin.id), bin] } : warehouse));
        update("defaultBinId", bin.id);
    };

    React.useEffect(() => {
        if (!open || !inventorySettings) return;
        setForm((prev) => {
            const next = { ...prev };
            if (prev.type === "services" || !features.inventory) next.trackInventory = false;
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
            if (!next.trackInventory || !next.tracksBatch) next.defaultBatchNo = "";
            if (!next.trackInventory || !next.tracksLot) next.defaultLotNo = "";
            if (!next.trackInventory || !next.tracksExpiry) {
                next.defaultExpiryDate = "";
                next.defaultExpiryDateBs = "";
            }
            return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        });
    }, [open, inventorySettings, features.inventory, features.warehouses, features.bins, features.batch, features.lot, features.expiry, form.type]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Item name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await createItem({
                name: form.name.trim(),
                sku: form.sku.trim() || undefined,
                hsCode: form.hsCode.trim() || undefined,
                unit: form.unit || undefined,
                type: form.type,
                salesPrice: form.salesPrice ? Number(form.salesPrice) : undefined,
                purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
                reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
                safetyStock: form.safetyStock ? Number(form.safetyStock) : undefined,
                openingQty: showOpeningStock && form.openingQty ? Number(form.openingQty) : undefined,
                openingPrice: showOpeningStock && form.openingPrice ? Number(form.openingPrice) : undefined,
                groupId: form.groupId || undefined,
                incomeAccountId: form.incomeAccountId.trim() || undefined,
                expenseAccountId: form.expenseAccountId.trim() || undefined,
                taxCodeIds: taxable ? form.taxCodeIds : undefined,
                trackInventory: form.type === "goods" && features.inventory ? form.trackInventory : false,
                tracksBatch: showOpeningStock && features.batch ? form.tracksBatch : false,
                tracksLot: showOpeningStock && features.lot ? form.tracksLot : false,
                tracksExpiry: showOpeningStock && features.expiry ? form.tracksExpiry : false,
                defaultWarehouseId: showOpeningStock && features.warehouses ? form.defaultWarehouseId || undefined : undefined,
                defaultBinId: showOpeningStock && features.bins ? form.defaultBinId || undefined : undefined,
                defaultBatchNo: showOpeningStock && features.batch && form.tracksBatch ? form.defaultBatchNo.trim() || undefined : undefined,
                defaultLotNo: showOpeningStock && features.lot && form.tracksLot ? form.defaultLotNo.trim() || undefined : undefined,
                defaultExpiryDate: showOpeningStock && features.expiry && form.tracksExpiry ? form.defaultExpiryDate || undefined : undefined,
                defaultExpiryDateBs: showOpeningStock && features.expiry && form.tracksExpiry ? form.defaultExpiryDateBs || undefined : undefined,
            });
            onSuccess(res);
            onClose();
            // Reset form
            setForm({
                name: "", sku: "", hsCode: "", unit: "", type: "goods",
                salesPrice: "", purchasePrice: "", reorderLevel: "", safetyStock: "", openingQty: "", openingPrice: "",
                groupId: "", incomeAccountId: "", expenseAccountId: "", taxCodeIds: []
                , trackInventory: true, tracksBatch: false, tracksLot: false, tracksExpiry: false,
                defaultWarehouseId: "", defaultBinId: "", defaultBatchNo: "", defaultLotNo: "", defaultExpiryDate: "", defaultExpiryDateBs: ""
            });
            setTaxable(false);
        } catch (err: any) {
            setError(err?.message ?? "Failed to create item");
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="my-8 w-full max-w-2xl rounded-[2.5rem] border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-8 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <PackagePlus className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">New Item Details</h3>
                            <p className="text-xs text-muted-foreground">Fill in all details to create a new inventory item</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-8">
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Type Toggle */}
                    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit mx-auto">
                        {(["goods", "services"] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => update("type", t)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                                    form.type === t
                                        ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {t === "goods" ? "Inventory Item" : "Service Item"}
                            </button>
                        ))}
                    </div>

                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-indigo-600" />
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Basic Information</h4>
                        </div>
                        <div className="grid gap-5">
                            <label className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">ITEM NAME *</span>
                                <Input
                                    autoFocus
                                    value={form.name}
                                    onChange={e => update("name", e.target.value)}
                                    placeholder="e.g. Premium Ledger Paper"
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-5">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">SKU / CODE</span>
                                    <Input
                                        value={form.sku}
                                        onChange={e => update("sku", e.target.value)}
                                        placeholder="LKH-001"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">HS CODE</span>
                                    <Input
                                        value={form.hsCode}
                                        onChange={e => update("hsCode", e.target.value)}
                                        placeholder="4820.10"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">UNIT</span>
                                        <button
                                            type="button"
                                            onClick={() => setAddUnitOpen(true)}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                                        >
                                            <Plus className="h-2.5 w-2.5" /> ADD
                                        </button>
                                    </div>
                                    <select
                                        value={form.unit}
                                        onChange={e => update("unit", e.target.value)}
                                        className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="">Select unit</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ITEM GROUP</span>
                                        <button
                                            type="button"
                                            onClick={() => setAddGroupOpen(true)}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                                        >
                                            <Plus className="h-2.5 w-2.5" /> ADD
                                        </button>
                                    </div>
                                    <select
                                        value={form.groupId}
                                        onChange={e => update("groupId", e.target.value)}
                                        className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="">Select group</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section: Pricing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pricing & Taxes</h4>
                        </div>
                        <div className="grid gap-5">
                            <div className="grid grid-cols-2 gap-5">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">SALES PRICE</span>
                                    <Input
                                        type="number"
                                        value={form.salesPrice}
                                        onChange={e => update("salesPrice", e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">PURCHASE PRICE</span>
                                    <Input
                                        type="number"
                                        value={form.purchasePrice}
                                        onChange={e => update("purchasePrice", e.target.value)}
                                        placeholder="0.00"
                                        disabled={form.type === "services"}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-50"
                                    />
                                </label>
                            </div>

                            {/* Taxes */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">APPLY TAX</span>
                                    <div className="flex p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => { setTaxable(false); update("taxCodeIds", []); }}
                                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", !taxable ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500")}
                                        >OFF</button>
                                        <button
                                            type="button"
                                            onClick={() => setTaxable(true)}
                                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", taxable ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500")}
                                        >ON</button>
                                    </div>
                                </div>
                                {taxable && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {taxes.map(tax => (
                                            <label key={tax.id} className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                                form.taxCodeIds.includes(tax.id)
                                                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                    checked={form.taxCodeIds.includes(tax.id)}
                                                    onChange={() => {
                                                        const next = new Set(form.taxCodeIds);
                                                        if (next.has(tax.id)) next.delete(tax.id);
                                                        else next.add(tax.id);
                                                        update("taxCodeIds", Array.from(next));
                                                    }}
                                                />
                                                <span className="text-xs font-medium">{tax.name} ({tax.rate}%)</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: Opening Stock */}
                    {showOpeningStock && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <History className="h-4 w-4 text-orange-600" />
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Opening Stock</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">OPENING QTY</span>
                                    <Input
                                        type="number"
                                        value={form.openingQty}
                                        onChange={e => update("openingQty", e.target.value)}
                                        placeholder="0"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">OPENING RATE</span>
                                    <Input
                                        type="number"
                                        value={form.openingPrice}
                                        onChange={e => update("openingPrice", e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">REORDER LEVEL</span>
                                    <Input
                                        type="number"
                                        value={form.reorderLevel}
                                        onChange={e => update("reorderLevel", e.target.value)}
                                        placeholder="0"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">SAFETY STOCK</span>
                                    <Input
                                        type="number"
                                        value={form.safetyStock}
                                        onChange={e => update("safetyStock", e.target.value)}
                                        placeholder="0"
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </label>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Default Stock Identity</div>
                                <div className="grid grid-cols-2 gap-4">
                                    {features.warehouses && (
                                        <label className="space-y-1.5">
                                            <span className="ml-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                                WAREHOUSE
                                                <button type="button" onClick={() => setAddWarehouseOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-700"><Plus className="h-3 w-3" /> ADD</button>
                                            </span>
                                            <SearchableSelect options={[{ id: "", name: "No default warehouse" }, ...warehouses]} valueId={form.defaultWarehouseId} onChange={(id) => setForm((prev) => ({ ...prev, defaultWarehouseId: id, defaultBinId: "" }))} placeholder="Search warehouse..." />
                                        </label>
                                    )}
                                    {features.bins && (
                                        <label className="space-y-1.5">
                                            <span className="ml-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                                BIN
                                                <button type="button" disabled={!form.defaultWarehouseId} onClick={() => setAddBinOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-700 disabled:opacity-50"><Plus className="h-3 w-3" /> ADD</button>
                                            </span>
                                            <SearchableSelect options={[{ id: "", name: form.defaultWarehouseId ? "No default bin" : "Choose warehouse first" }, ...defaultBins]} valueId={form.defaultBinId} onChange={(id) => update("defaultBinId", id)} placeholder="Search bin..." disabled={!form.defaultWarehouseId} />
                                        </label>
                                    )}
                                    {features.batch && (
                                        <label className="space-y-1.5">
                                            <span className="ml-1 text-xs font-bold text-slate-600 dark:text-slate-400">BATCH NO.</span>
                                            <Input value={form.defaultBatchNo} onChange={(e) => { update("defaultBatchNo", e.target.value); update("tracksBatch", Boolean(e.target.value.trim())); }} placeholder="Batch no." className="h-12 rounded-2xl bg-white dark:bg-slate-950" />
                                        </label>
                                    )}
                                    {features.lot && (
                                        <label className="space-y-1.5">
                                            <span className="ml-1 text-xs font-bold text-slate-600 dark:text-slate-400">LOT NO.</span>
                                            <Input value={form.defaultLotNo} onChange={(e) => { update("defaultLotNo", e.target.value); update("tracksLot", Boolean(e.target.value.trim())); }} placeholder="Lot no." className="h-12 rounded-2xl bg-white dark:bg-slate-950" />
                                        </label>
                                    )}
                                    {features.expiry && (
                                        <div className="col-span-2 space-y-1.5">
                                            <span className="ml-1 text-xs font-bold text-slate-600 dark:text-slate-400">EXPIRY DATE</span>
                                            <DualDateInput value={{ ad: form.defaultExpiryDate, bs: form.defaultExpiryDateBs }} onChange={({ ad, bs }) => { update("defaultExpiryDate", ad); update("defaultExpiryDateBs", bs); update("tracksExpiry", Boolean(ad || bs)); }} accentColor="bg-orange-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section: Accounting */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Accounting Integration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <label className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">INCOME ACCOUNT</span>
                                <Input
                                    value={form.incomeAccountId}
                                    onChange={e => update("incomeAccountId", e.target.value)}
                                    placeholder="Ledger ID or Name"
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">EXPENSE ACCOUNT</span>
                                <Input
                                    value={form.expenseAccountId}
                                    onChange={e => update("expenseAccountId", e.target.value)}
                                    placeholder="Ledger ID or Name"
                                    disabled={form.type === "services"}
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-50"
                                />
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="border-t px-8 py-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 px-8 rounded-2xl text-sm font-bold border-2 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="h-12 px-10 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save & Select
                            </>
                        )}
                    </button>
                </div>
            </div>

            <AddUnitDialog
                open={addUnitOpen}
                onClose={() => setAddUnitOpen(false)}
                onSuccess={(newUnit) => {
                    setUnits(prev => [...prev, newUnit]);
                    update("unit", newUnit.name);
                }}
            />

            <AddGroupDialog
                open={addGroupOpen}
                onClose={() => setAddGroupOpen(false)}
                onSuccess={(newGroup) => {
                    setGroups(prev => [...prev, newGroup]);
                    update("groupId", newGroup.id);
                }}
            />
            <AddWarehouseDialog open={addWarehouseOpen} onClose={() => setAddWarehouseOpen(false)} onSuccess={(warehouse) => addWarehouseRecord(warehouse as Warehouse)} />
            <AddWarehouseDialog open={addBinOpen} onClose={() => setAddBinOpen(false)} warehouseId={form.defaultWarehouseId || undefined} warehouseName={selectedDefaultWarehouse?.name} onSuccess={(bin) => addBinRecord(bin as WarehouseBin)} />
        </div>,
        document.body
    );
}

