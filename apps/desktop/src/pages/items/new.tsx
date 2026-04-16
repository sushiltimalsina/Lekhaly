import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { createItem } from "@/lib/api/items";
import { listTaxes } from "@/lib/api/taxes";
import { listUnits, type UnitRecord } from "@/lib/api/units";
import { listItemGroups, type ItemGroupRecord } from "@/lib/api/item-groups";
import { cn } from "@/lib/utils";
import { ArrowLeft, PackagePlus, Plus, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AddUnitDialog from "@/components/app/add-unit-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";

type ItemType = "goods" | "services";
type TaxCode = { id: string; name: string; rate: number };

export default function NewItemPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [taxable, setTaxable] = React.useState(false);
  const [taxes, setTaxes] = React.useState<TaxCode[]>([]);
  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [groups, setGroups] = React.useState<ItemGroupRecord[]>([]);
  const [addUnitOpen, setAddUnitOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);

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
  });

  React.useEffect(() => {
    let alive = true;
    listTaxes({ take: 100 })
      .then((res: any) => {
        if (!alive) return;
        const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        setTaxes(
          Array.isArray(data)
            ? data
                .filter((t: any) => t && typeof t.id === "string")
                .map((t: any) => ({ id: t.id, name: String(t.name), rate: Number(t.rate ?? 0) }))
            : []
        );
      })
      .catch(() => {
        if (!alive) return;
        setTaxes([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    listUnits({ take: 200 })
      .then((res: any) => {
        if (!alive) return;
        const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        setUnits(
          Array.isArray(data)
            ? data
                .filter((u: any) => u && typeof u.id === "string")
                .map((u: any) => ({ id: u.id, name: String(u.name) }))
            : []
        );
      })
      .catch(() => {
        if (!alive) return;
        setUnits([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    listItemGroups({ take: 200 })
      .then((res: any) => {
        if (!alive) return;
        const data = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        setGroups(
          Array.isArray(data)
            ? data
                .filter((g: any) => g && typeof g.id === "string")
                .map((g: any) => ({ id: g.id, name: String(g.name) }))
            : []
        );
      })
      .catch(() => {
        if (!alive) return;
        setGroups([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const update = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }

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
      });
      setSuccess("Item created successfully.");
      setTimeout(() => navigate("/items"), 600);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Add New Item"
        description="Register a stock item or service, with pricing and taxation details."
        actions={
          <Link
            to="/items"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stock
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                <PackagePlus className="h-6 w-6" />
              </div>
              <div>
                <div className="text-base font-bold">Item Profile</div>
                <div className="text-xs text-muted-foreground">Name, type, grouping and unit details.</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Item / Service Name *</span>
                <Input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Laptop, Consultation Service"
                  className="h-12 rounded-xl"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">SKU</span>
                <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Optional" className="h-12 rounded-xl" />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">HS Code</span>
                <Input value={form.hsCode} onChange={(e) => update("hsCode", e.target.value)} placeholder="Optional" className="h-12 rounded-xl" />
              </label>

              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Type</span>
                <div className="flex gap-2">
                  {(["goods", "services"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("type", t)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs font-medium transition",
                        form.type === t ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                      )}
                    >
                      {t === "goods" ? "Goods" : "Services"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Unit</span>
                <div className="flex gap-2">
                  <select
                    value={form.unit}
                    onChange={(e) => update("unit", e.target.value)}
                    className="h-12 flex-1 rounded-xl border bg-background px-3 text-sm"
                  >
                    <option value="">Select unit...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddUnitOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 text-xs font-medium hover:bg-muted transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Group</span>
                <div className="flex gap-2">
                  <select
                    value={form.groupId}
                    onChange={(e) => update("groupId", e.target.value)}
                    className="h-12 flex-1 rounded-xl border bg-background px-3 text-sm"
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAddGroupOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 text-xs font-medium hover:bg-muted transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="text-sm font-bold">Pricing</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Sales Price</span>
                <Input type="number" value={form.salesPrice} onChange={(e) => update("salesPrice", e.target.value)} placeholder="0.00" className="h-12 rounded-xl" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Purchase Price</span>
                <Input type="number" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} placeholder="0.00" className="h-12 rounded-xl" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Opening Qty</span>
                <Input type="number" value={form.openingQty} onChange={(e) => update("openingQty", e.target.value)} placeholder="0" className="h-12 rounded-xl" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Opening Price</span>
                <Input type="number" value={form.openingPrice} onChange={(e) => update("openingPrice", e.target.value)} placeholder="0.00" className="h-12 rounded-xl" />
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="text-sm font-bold">Accounts</div>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Income Account ID</span>
              <Input value={form.incomeAccountId} onChange={(e) => update("incomeAccountId", e.target.value)} placeholder="Optional" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Expense Account ID</span>
              <Input
                value={form.expenseAccountId}
                onChange={(e) => update("expenseAccountId", e.target.value)}
                placeholder="Optional"
                disabled={form.type === "services"}
              />
            </label>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="text-sm font-bold">Tax</div>
            <div className="flex items-center gap-2">
              {(["non-taxable", "taxable"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const next = t === "taxable";
                    setTaxable(next);
                    if (!next) setForm((prev) => ({ ...prev, taxCodeIds: [] }));
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    taxable === (t === "taxable") ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  )}
                >
                  {t === "taxable" ? "Taxable" : "Non-taxable"}
                </button>
              ))}
            </div>

            {taxable ? (
              <div className="grid gap-2 rounded-xl border bg-background p-3 text-sm">
                {taxes.length ? (
                  taxes.map((tax) => {
                    const checked = form.taxCodeIds.includes(tax.id);
                    return (
                      <label key={tax.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          {tax.name} ({tax.rate}%)
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm((prev) => {
                              const next = new Set(prev.taxCodeIds);
                              if (next.has(tax.id)) next.delete(tax.id);
                              else next.add(tax.id);
                              return { ...prev, taxCodeIds: Array.from(next) };
                            });
                          }}
                        />
                      </label>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground">No tax codes found.</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No tax will be applied.</div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm space-y-2">
              {error ? (
                <div className="rounded-lg border border-red-600/30 bg-red-600/10 px-3 py-2 text-red-700">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-emerald-700">
                  {success}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-md transition",
                saving ? "opacity-70" : "hover:shadow-lg hover:-translate-y-[1px]"
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Create Item"}
            </button>
          </div>
        </section>
      </form>

      <AddUnitDialog
        open={addUnitOpen}
        onClose={() => setAddUnitOpen(false)}
        onSuccess={(unit: UnitRecord) => {
          setUnits((prev) => [...prev, unit]);
          update("unit", unit.name);
        }}
      />

      <AddGroupDialog
        open={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onSuccess={(group) => {
          setGroups((prev) => [...prev, group]);
          update("groupId", group.id);
        }}
      />
    </div>
  );
}
