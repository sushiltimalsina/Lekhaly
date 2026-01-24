"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { createItem } from "@/lib/api/items";
import { listTaxes } from "@/lib/api/taxes";
import { createUnit, listUnits, type UnitRecord } from "@/lib/api/units";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus, Save } from "lucide-react";
import Link from "next/link";

type ItemType = "goods" | "services";
type TaxCode = { id: string; name: string; rate: number };

export default function NewItemPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [taxable, setTaxable] = React.useState(false);
  const [taxes, setTaxes] = React.useState<TaxCode[]>([]);
  const [units, setUnits] = React.useState<UnitRecord[]>([]);
  const [unitInput, setUnitInput] = React.useState("");
  const [unitBusy, setUnitBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    sku: "",
    hsCode: "",
    unit: "",
    type: "goods" as ItemType,
    salesPrice: "",
    purchasePrice: "",
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

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addUnit = async () => {
    const name = unitInput.trim();
    if (!name) return;
    setUnitBusy(true);
    try {
      const created = await createUnit({ name });
      setUnits((prev) => {
        const next = [...prev, created];
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      update("unit", created.name);
      setUnitInput("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add unit.");
    } finally {
      setUnitBusy(false);
    }
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
        incomeAccountId: form.incomeAccountId.trim() || undefined,
        expenseAccountId: form.expenseAccountId.trim() || undefined,
        taxCodeIds: taxable ? form.taxCodeIds : undefined,
      });
      setSuccess("Item created successfully.");
      setTimeout(() => router.push("/items"), 600);
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
        description="Create a goods or services item with pricing and accounting details."
        actions={
          <Link
            href="/items"
            className="inline-flex items-center gap-6 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Items
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Item Details</div>
              <div className="text-xs text-muted-foreground">Basic information about the item.</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Item Name</span>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Premium Ledger Paper"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">SKU(Unique Code)</span>
              <Input
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                placeholder="e.g. LKH-001"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">HS Code</span>
              <Input
                value={form.hsCode}
                onChange={(e) => update("hsCode", e.target.value)}
                placeholder="e.g. 4820.10"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Unit</span>
              <select
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Input
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  placeholder="Add new unit"
                />
                <button
                  type="button"
                  onClick={addUnit}
                  disabled={unitBusy || !unitInput.trim()}
                  className={cn(
                    "rounded-md border px-3 py-2 text-xs font-medium transition",
                    unitBusy || !unitInput.trim()
                      ? "opacity-60"
                      : "hover:bg-muted"
                  )}
                >
                  Add
                </button>
              </div>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Type</span>
              <div className="flex items-center gap-2">
                {(["goods", "services"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("type", t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      form.type === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {t === "goods" ? "Goods" : "Services"}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <div className="text-sm font-semibold">Pricing</div>
          <div className="grid gap-4">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Sales Price</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.salesPrice}
                onChange={(e) => update("salesPrice", e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Purchase Price</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => update("purchasePrice", e.target.value)}
                placeholder="0.00"
                disabled={form.type === "services"}
              />
            </label>
            {form.type === "services" ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                Services don't track stock. Purchase price is optional.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm space-y-5 lg:col-span-2">
          <div className="text-sm font-semibold">Accounting</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Income Account ID</span>
              <Input
                value={form.incomeAccountId}
                onChange={(e) => update("incomeAccountId", e.target.value)}
                placeholder="Optional"
              />
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
            <div className="space-y-2 text-sm">
              <span className="text-muted-foreground">Tax</span>
              <div className="flex items-center gap-2">
                {(["non-taxable", "taxable"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const next = t === "taxable";
                      setTaxable(next);
                      if (!next) {
                        setForm((prev) => ({ ...prev, taxCodeIds: [] }));
                      }
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      taxable === (t === "taxable")
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {t === "taxable" ? "Taxable" : "Non-taxable"}
                  </button>
                ))}
              </div>
              {taxable ? (
                <div className="grid gap-2 rounded-lg border bg-background p-3 text-sm">
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
          </div>
        </section>

        <section className="lg:col-span-2 flex items-center justify-between">
          <div className="text-sm">
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
              "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-md transition",
              saving ? "opacity-70" : "hover:shadow-lg hover:-translate-y-[1px]"
            )}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Create Item"}
          </button>
        </section>
      </form>
    </div>
  );
}
