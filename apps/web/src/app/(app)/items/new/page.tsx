"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { createItem, listItems } from "@/lib/api/items";
import { listTaxes } from "@/lib/api/taxes";
import { listUnits, type UnitRecord } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, PackagePlus, Save, Plus, X, Layers,
  ShieldCheck, AlertTriangle, Package, BookOpen, DollarSign
} from "lucide-react";
import Link from "next/link";
import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";

type ItemType = "goods" | "services";
type TaxCode = { id: string; name: string; rate: number };
type SimpleItem = { id: string; name: string; sku?: string; unit?: string };
type BomLine = { componentId: string; componentName: string; qty: number };
type Tab = "basic" | "pricing" | "inventory" | "accounting";

export default function NewItemPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [taxable, setTaxable] = React.useState(false);
  const [taxes, setTaxes] = React.useState<TaxCode[]>([]);
  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [allItems, setAllItems] = React.useState<SimpleItem[]>([]);
  const [addUnitOpen, setAddUnitOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>("basic");

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
    isSerialized: false,
    isKit: false,
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

    listUnits({ take: 200 }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setUnits(
        Array.isArray(data)
          ? data.filter((u: any) => u?.id).map((u: any) => ({ id: u.id, name: String(u.name) }))
          : []
      );
    }).catch(() => setUnits([]));

    listItemGroups({ take: 200 }).then((res: any) => {
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
  }, []);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.name.trim()) { setError("Item name is required."); return; }
    if (form.isKit && bomLines.length === 0) { setError("A kit item must have at least one component."); return; }

    setSaving(true);
    try {
      await createItem({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        hsCode: form.hsCode.trim() || undefined,
        unit: form.unit.trim() || undefined,
        type: form.type,
        salesPrice: form.salesPrice ? Number(form.salesPrice) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        openingQty: form.openingQty ? Number(form.openingQty) : undefined,
        openingPrice: form.openingPrice ? Number(form.openingPrice) : undefined,
        groupId: form.groupId || undefined,
        incomeAccountId: form.incomeAccountId.trim() || undefined,
        expenseAccountId: form.expenseAccountId.trim() || undefined,
        taxCodeIds: taxable ? form.taxCodeIds : undefined,
        minStockLevel: form.minStockLevel ? Number(form.minStockLevel) : undefined,
        reorderQty: form.reorderQty ? Number(form.reorderQty) : undefined,
        isSerialized: form.isSerialized,
        isKit: form.isKit,
        components: form.isKit
          ? bomLines.map((l) => ({ componentId: l.componentId, qty: l.qty }))
          : undefined,
      } as any);
      setSuccess("Item created successfully!");
      setTimeout(() => router.push("/items"), 600);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create item.");
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "basic", label: "Basic Info", icon: Package },
    { key: "pricing", label: "Pricing", icon: DollarSign },
    { key: "inventory", label: "Inventory Controls", icon: Layers },
    { key: "accounting", label: "Accounting & Tax", icon: BookOpen },
  ];

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        title="Add New Item"
        description="Create a goods or services item with full inventory and accounting setup."
        icon={PackagePlus}
        actions={
          <Link href="/items" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" /> Back to Items
          </Link>
        }
      />

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-2xl bg-muted/40 p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
              activeTab === key
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* BASIC INFO */}
        {activeTab === "basic" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5 lg:col-span-2">
              <SectionHeader icon={Package} title="Item Details" desc="Core identification info for this item." />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <select value={form.groupId} onChange={(e) => update("groupId", e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">Select group</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </Field>
                <Field label="Unit" action={<AddBtn onClick={() => setAddUnitOpen(true)} />}>
                  <select value={form.unit} onChange={(e) => update("unit", e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">Select unit</option>
                    {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </Field>
                <Field label="Item Type">
                  <div className="flex gap-2">
                    {(["goods", "services"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => update("type", t)}
                        className={cn("rounded-xl border px-4 py-2 text-xs font-semibold transition-all", form.type === t ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-background hover:bg-muted")}>
                        {t === "goods" ? "📦 Goods" : "⚙️ Services"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </section>
          </div>
        )}

        {/* PRICING */}
        {activeTab === "pricing" && (
          <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <SectionHeader icon={DollarSign} title="Pricing & Opening Balance" desc="Set default prices and initial stock values." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sales Price">
                <Input type="number" min="0" step="0.01" value={form.salesPrice} onChange={(e) => update("salesPrice", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Purchase Price">
                <Input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} placeholder="0.00" disabled={form.type === "services"} />
              </Field>
              <Field label="Opening Quantity">
                <Input type="number" min="0" step="0.01" value={form.openingQty} onChange={(e) => update("openingQty", e.target.value)} placeholder="0" disabled={form.type === "services"} />
              </Field>
              <Field label="Opening Price / Rate">
                <Input type="number" min="0" step="0.01" value={form.openingPrice} onChange={(e) => update("openingPrice", e.target.value)} placeholder="0.00" disabled={form.type === "services"} />
              </Field>
            </div>
            {Number(form.openingQty) > 0 && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-4 py-3 text-sm">
                Opening Amount: <span className="font-black text-emerald-700 dark:text-emerald-400">{(Number(form.openingQty) * Number(form.openingPrice || 0)).toFixed(2)}</span>
              </div>
            )}
          </section>
        )}

        {/* INVENTORY CONTROLS */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
              <SectionHeader icon={AlertTriangle} title="Reorder & Low Stock Alerts" desc="Set thresholds to trigger automatic low-stock warnings." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minimum Stock Level" hint="Alert shows when stock drops below this">
                  <Input type="number" min="0" step="0.01" value={form.minStockLevel} onChange={(e) => update("minStockLevel", e.target.value)} placeholder="e.g. 10" disabled={form.type === "services"} />
                </Field>
                <Field label="Reorder Quantity" hint="Suggested qty when creating reorder PO">
                  <Input type="number" min="0" step="0.01" value={form.reorderQty} onChange={(e) => update("reorderQty", e.target.value)} placeholder="e.g. 50" disabled={form.type === "services"} />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
              <SectionHeader icon={ShieldCheck} title="Advanced Tracking" desc="Enable serial number or kit/bundle behaviour." />
              <div className="flex flex-col gap-4">
                <Toggle
                  id="isSerialized"
                  label="Serialized Item"
                  desc="Each unit has a unique serial number tracked from purchase to sale."
                  checked={form.isSerialized}
                  onChange={(v) => update("isSerialized", v)}
                  disabled={form.type === "services"}
                />
                <Toggle
                  id="isKit"
                  label="Kit / Bundle Item"
                  desc="When sold, automatically deducts the component items from stock instead of this item."
                  checked={form.isKit}
                  onChange={(v) => update("isKit", v)}
                  disabled={form.type === "services"}
                />
              </div>
            </section>

            {/* BOM Builder */}
            {form.isKit && (
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
        {activeTab === "accounting" && (
          <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <SectionHeader icon={BookOpen} title="Accounting & Tax" desc="Link this item to Chart of Accounts and configure tax." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Income Account ID">
                <Input value={form.incomeAccountId} onChange={(e) => update("incomeAccountId", e.target.value)} placeholder="Account UUID (optional)" />
              </Field>
              <Field label="Expense / COGS Account ID">
                <Input value={form.expenseAccountId} onChange={(e) => update("expenseAccountId", e.target.value)} placeholder="Account UUID (optional)" disabled={form.type === "services"} />
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
        )}

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
              {saving ? "Saving..." : "Create Item"}
            </Button>
          </div>
        </div>
      </form>

      <AddUnitDialog open={addUnitOpen} onClose={() => setAddUnitOpen(false)} onSuccess={(unit) => { setUnits((p) => [...p, unit]); update("unit", unit.name); }} />
      <AddGroupDialog open={addGroupOpen} onClose={() => setAddGroupOpen(false)} onSuccess={(group) => { setGroups((p) => [...p, group]); update("groupId", group.id); }} />
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
