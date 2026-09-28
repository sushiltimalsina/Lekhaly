"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { MoneyText } from "@/components/app/money";
import { Button, Card, CardContent } from "@lekhaly/ui";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Receipt,
  Package,
  Scale,
  Hash,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  listEligibleExpenses,
  listEligiblePurchases,
  previewLandedCostAllocation,
  allocateLandedCost,
  type EligibleExpenseVoucher,
  type EligiblePurchaseVoucher,
  type LandedCostPreview,
  type LandedCostAllocationResult,
} from "@/lib/api/inventory";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = [
  { step: 1, label: "Expense Voucher", icon: Receipt },
  { step: 2, label: "Purchase Voucher", icon: Package },
  { step: 3, label: "Preview & Confirm", icon: BarChart3 },
  { step: 4, label: "Done", icon: CheckCircle2 },
] as const;

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map(({ step, label, icon: Icon }, i) => {
        const done = current > step;
        const active = current === step;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : active
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : done ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 w-16 transition-all duration-300",
                  current > step ? "bg-emerald-500" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function VoucherCard({
  voucher,
  selected,
  onSelect,
  type,
}: {
  voucher: EligibleExpenseVoucher | EligiblePurchaseVoucher;
  selected: boolean;
  onSelect: () => void;
  type: "expense" | "purchase";
}) {
  const isExpense = type === "expense";
  const expense = voucher as EligibleExpenseVoucher;
  const purchase = voucher as EligiblePurchaseVoucher;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border-2 p-4 text-left transition-all duration-200",
        selected
          ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
          : "border-border bg-background hover:border-orange-500/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">
              {voucher.voucherNumber || "—"}
            </span>
            {selected && (
              <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Selected
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {voucher.partyName && <span>{voucher.partyName} · </span>}
            <span>{new Date(voucher.voucherDate).toLocaleDateString()}</span>
          </div>
          {voucher.memo && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{voucher.memo}</p>
          )}
          {isExpense && (
            <div className="mt-2 flex flex-wrap gap-1">
              {expense.lines.slice(0, 3).map((l) => (
                <span
                  key={l.lineId}
                  className="rounded-lg bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {l.accountName}
                </span>
              ))}
              {expense.lines.length > 3 && (
                <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{expense.lines.length - 3} more
                </span>
              )}
            </div>
          )}
          {!isExpense && (
            <div className="mt-2 text-xs text-muted-foreground">
              {purchase.itemsCount} item{purchase.itemsCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-foreground">
            <MoneyText
              value={isExpense ? Number(expense.amount) : Number(purchase.totalAmount)}
              className="text-sm"
            />
          </div>
          <ChevronRight
            className={cn(
              "ml-auto mt-1 h-4 w-4 transition-transform",
              selected ? "text-orange-500 translate-x-0.5" : "text-muted-foreground"
            )}
          />
        </div>
      </div>
    </button>
  );
}

export default function LandedCostsPage() {
  const [step, setStep] = React.useState<Step>(1);

  // Data
  const [expenses, setExpenses] = React.useState<EligibleExpenseVoucher[]>([]);
  const [purchases, setPurchases] = React.useState<EligiblePurchaseVoucher[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Selections
  const [selectedExpenseId, setSelectedExpenseId] = React.useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = React.useState<string | null>(null);
  const [allocationMethod, setAllocationMethod] = React.useState<"value" | "quantity">("value");

  // Preview
  const [preview, setPreview] = React.useState<LandedCostPreview | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  // Allocation
  const [result, setResult] = React.useState<LandedCostAllocationResult | null>(null);
  const [allocating, setAllocating] = React.useState(false);
  const [allocError, setAllocError] = React.useState<string | null>(null);

  // Filters
  const [expenseSearch, setExpenseSearch] = React.useState("");
  const [purchaseSearch, setPurchaseSearch] = React.useState("");

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [exp, purch] = await Promise.all([listEligibleExpenses(), listEligiblePurchases()]);
        setExpenses(Array.isArray(exp) ? exp : []);
        setPurchases(Array.isArray(purch) ? purch : []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId) ?? null;
  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId) ?? null;

  const filteredExpenses = expenses.filter((e) => {
    const q = expenseSearch.toLowerCase();
    return (
      !q ||
      (e.voucherNumber ?? "").toLowerCase().includes(q) ||
      (e.partyName ?? "").toLowerCase().includes(q) ||
      (e.memo ?? "").toLowerCase().includes(q)
    );
  });

  const filteredPurchases = purchases.filter((p) => {
    const q = purchaseSearch.toLowerCase();
    return (
      !q ||
      (p.voucherNumber ?? "").toLowerCase().includes(q) ||
      (p.partyName ?? "").toLowerCase().includes(q) ||
      (p.memo ?? "").toLowerCase().includes(q)
    );
  });

  async function handlePreview() {
    if (!selectedExpenseId || !selectedPurchaseId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const data = await previewLandedCostAllocation({
        expenseVoucherId: selectedExpenseId,
        purchaseVoucherId: selectedPurchaseId,
        allocationMethod,
      });
      setPreview(data);
      setStep(3);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to generate preview";
      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAllocate() {
    if (!preview) return;
    setAllocating(true);
    setAllocError(null);
    try {
      const data = await allocateLandedCost({
        expenseVoucherId: preview.expenseVoucherId,
        purchaseVoucherId: preview.purchaseVoucherId,
        allocationMethod: preview.allocationMethod,
        allocationLines: preview.lines.map((l) => ({
          purchaseVoucherLineId: l.purchaseVoucherLineId,
          amount: Number(l.allocatedAmount),
        })),
      });
      setResult(data);
      setStep(4);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Allocation failed";
      setAllocError(msg);
    } finally {
      setAllocating(false);
    }
  }

  function reset() {
    setStep(1);
    setSelectedExpenseId(null);
    setSelectedPurchaseId(null);
    setAllocationMethod("value");
    setPreview(null);
    setResult(null);
    setAllocError(null);
    setPreviewError(null);
  }

  return (
    <div className="space-y-8 pb-20 text-foreground">
      <PageHeader
        title="Landed Cost Capitalization"
        description="Distribute import duties, freight, and other acquisition costs into inventory value"
      />

      {/* Step Indicator */}
      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {/* Step 1: Select Expense Voucher */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <Receipt className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Select Expense Voucher</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the posted voucher containing freight, duty, or other landing charges
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search expense vouchers..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="mb-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-orange-500 transition-colors"
              />

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8" />
                  <p className="text-sm">No eligible expense vouchers found</p>
                  <p className="text-xs">
                    Post a journal or payment voucher with expense account debit lines first
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExpenses.map((exp) => (
                    <VoucherCard
                      key={exp.id}
                      voucher={exp}
                      selected={selectedExpenseId === exp.id}
                      onSelect={() => setSelectedExpenseId(exp.id)}
                      type="expense"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={!selectedExpenseId}
              onClick={() => setStep(2)}
              className="gap-2 rounded-xl bg-orange-500 px-6 text-white hover:bg-orange-600"
            >
              Next: Select Purchase <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Purchase Voucher + Allocation Method */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Selected expense summary */}
          {selectedExpense && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold">{selectedExpense.voucherNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedExpense.partyName && `${selectedExpense.partyName} · `}
                      Total expense:{" "}
                      <MoneyText value={Number(selectedExpense.amount)} className="inline font-bold text-foreground" />
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-orange-500 hover:underline"
                >
                  Change
                </button>
              </CardContent>
            </Card>
          )}

          {/* Allocation method */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Scale className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Allocation Method</h2>
                  <p className="text-sm text-muted-foreground">
                    How should the expense be distributed across items?
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAllocationMethod("value")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-left transition-all",
                    allocationMethod === "value"
                      ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                      : "border-border hover:border-orange-500/40"
                  )}
                >
                  <TrendingUp
                    className={cn(
                      "h-7 w-7",
                      allocationMethod === "value" ? "text-orange-500" : "text-muted-foreground"
                    )}
                  />
                  <span className="font-semibold text-foreground">By Value</span>
                  <span className="text-center text-xs text-muted-foreground">
                    Distribute proportionally to each item's purchase cost
                  </span>
                </button>
                <button
                  onClick={() => setAllocationMethod("quantity")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-left transition-all",
                    allocationMethod === "quantity"
                      ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                      : "border-border hover:border-orange-500/40"
                  )}
                >
                  <Hash
                    className={cn(
                      "h-7 w-7",
                      allocationMethod === "quantity" ? "text-orange-500" : "text-muted-foreground"
                    )}
                  />
                  <span className="font-semibold text-foreground">By Quantity</span>
                  <span className="text-center text-xs text-muted-foreground">
                    Distribute equally per unit across all purchased items
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Purchase voucher selection */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <Package className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Select Purchase Voucher</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the posted purchase that received these goods
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search purchase vouchers..."
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                className="mb-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-orange-500 transition-colors"
              />

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8" />
                  <p className="text-sm">No eligible purchase vouchers found</p>
                  <p className="text-xs">Post a purchase voucher with inventory items first</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPurchases.map((p) => (
                    <VoucherCard
                      key={p.id}
                      voucher={p}
                      selected={selectedPurchaseId === p.id}
                      onSelect={() => setSelectedPurchaseId(p.id)}
                      type="purchase"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {previewError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {previewError}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              disabled={!selectedPurchaseId || previewLoading}
              onClick={handlePreview}
              className="gap-2 rounded-xl bg-orange-500 px-6 text-white hover:bg-orange-600"
            >
              {previewLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating Preview…
                </>
              ) : (
                <>
                  Preview Allocation <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && preview && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Expense Voucher
                </p>
                <p className="mt-1 font-semibold">{preview.expenseVoucherNumber}</p>
                <MoneyText
                  value={Number(preview.totalExpense)}
                  className="mt-1 text-lg font-bold text-orange-500"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Purchase Voucher
                </p>
                <p className="mt-1 font-semibold">{preview.purchaseVoucherNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {preview.lines.length} line{preview.lines.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Method
                </p>
                <p className="mt-1 font-semibold capitalize">{preview.allocationMethod} basis</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {preview.allocationMethod === "value"
                    ? "Proportional to item value"
                    : "Equal per unit quantity"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Allocation table */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-6 py-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold">Allocation Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Original Cost
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Original Rate
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Landed Cost
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        New Total
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        New Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((line) => (
                      <tr key={line.purchaseVoucherLineId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{line.itemName}</p>
                          {line.itemSku && (
                            <p className="text-xs text-muted-foreground">{line.itemSku}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {Number(line.qty).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          <MoneyText value={Number(line.originalAmount)} />
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                          <MoneyText value={Number(line.originalRate)} />
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-orange-500">
                          +<MoneyText value={Number(line.allocatedAmount)} />
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-foreground">
                          <MoneyText value={Number(line.newAmount)} />
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-emerald-500 font-semibold">
                          <MoneyText value={Number(line.newRate)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={4} className="px-6 py-3 text-sm font-bold uppercase text-muted-foreground">
                        Total Allocated
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-500">
                        <MoneyText value={Number(preview.totalExpense)} />
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Important — This action is irreversible</p>
              <p className="mt-0.5 text-xs">
                Confirming will create a journal voucher that debits the Inventory Asset account
                and credits the expense accounts. It will also update the stock ledger rates and
                inventory costing layers for all affected items.
              </p>
            </div>
          </div>

          {allocError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {allocError}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              disabled={allocating}
              onClick={handleAllocate}
              className="gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
            >
              {allocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Capitalizing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirm & Capitalize
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && result && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Landed Costs Capitalized!</h2>
            <p className="mt-2 text-muted-foreground">
              Successfully added{" "}
              <MoneyText
                value={Number(result.allocatedAmount)}
                className="inline font-bold text-foreground"
              />{" "}
              to inventory cost
            </p>
          </div>
          <Card className="w-full max-w-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adjustment Voucher</span>
                <span className="font-semibold">{result.adjustmentVoucherNumber ?? result.adjustmentVoucherId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Capitalized</span>
                <MoneyText value={Number(result.allocatedAmount)} className="font-bold text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={reset}
              className="gap-2 rounded-xl"
            >
              New Allocation
            </Button>
            <a href="/inventory" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
              Back to Inventory
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
