"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { createItem } from "@/lib/api/items";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus, Save } from "lucide-react";
import Link from "next/link";

type ItemType = "goods" | "services";

export default function NewItemPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    sku: "",
    unit: "",
    type: "goods" as ItemType,
    salesPrice: "",
    purchasePrice: "",
    incomeAccountId: "",
    expenseAccountId: "",
    taxCodeId: "",
  });

  const update = (key: keyof typeof form, value: string) => {
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
        unit: form.unit.trim() || undefined,
        type: form.type,
        salesPrice: form.salesPrice ? Number(form.salesPrice) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        incomeAccountId: form.incomeAccountId.trim() || undefined,
        expenseAccountId: form.expenseAccountId.trim() || undefined,
        taxCodeId: form.taxCodeId.trim() || undefined,
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
              <span className="text-muted-foreground">Unit</span>
              <Input
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                placeholder="e.g. pcs, kg, hour"
              />
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
                    {t}
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
                Services don’t track stock. Purchase price is optional.
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
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tax Code ID</span>
              <Input
                value={form.taxCodeId}
                onChange={(e) => update("taxCodeId", e.target.value)}
                placeholder="Optional"
              />
            </label>
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

