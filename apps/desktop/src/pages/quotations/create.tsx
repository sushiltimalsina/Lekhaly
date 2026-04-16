import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import { DualDateInput } from "@/components/app/dual-date-input";
import { adToBs } from "@/lib/dates/convert";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { createQuotation, updateQuotation, getQuotation } from "@/lib/api/quotations";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddCustomerDialog from "@/components/app/add-customer-dialog";
import SearchableSelect from "@/components/app/searchable-select";
import { ArrowLeft, FileSignature, Plus, Save, Trash2 } from "lucide-react";

type Line = { itemId: string; qty: string; rate: string; description?: string };

export default function QuotationCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(!!editId);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [items, setItems] = React.useState<ItemRecord[]>([]);

  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    partyId: "",
    quotationDate: { ad: new Date().toISOString().slice(0, 10), bs: adToBs(new Date().toISOString().slice(0, 10)) },
    expiryDate: { ad: "", bs: "" },
    referenceNo: "",
    memo: "",
    terms: "",
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [p, i] = await Promise.all([listParties({ type: "customer", take: 200 }), listItems({ take: 500 })]);
        setParties(p || []);
        setItems(i || []);

        if (editId) {
          const q = await getQuotation(editId);
          setForm({
            partyId: q.partyId,
            quotationDate: { ad: (q.quotationDate || "").split("T")[0], bs: q.quotationDateBs || "" },
            expiryDate: { ad: (q.expiryDate || "").split("T")[0], bs: q.expiryDateBs || "" },
            referenceNo: q.referenceNo || "",
            memo: q.memo || "",
            terms: q.terms || "",
          });
          setLines(
            (q.items || []).map((it: any) => ({
              itemId: it.itemId,
              qty: String(it.qty),
              rate: String(it.rate),
              description: it.description || "",
            }))
          );
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load quotation data");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [editId]);

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  }, [lines]);

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "", rate: "" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_l, i) => i !== idx));

  const onSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        partyId: form.partyId,
        quotationDate: form.quotationDate.ad,
        quotationDateBs: form.quotationDate.bs,
        expiryDate: form.expiryDate.ad || undefined,
        expiryDateBs: form.expiryDate.bs || undefined,
        referenceNo: form.referenceNo || undefined,
        memo: form.memo || undefined,
        terms: form.terms || undefined,
        items: lines
          .filter((l) => l.itemId && Number(l.qty) > 0)
          .map((l) => ({ itemId: l.itemId, qty: Number(l.qty), rate: Number(l.rate), description: l.description || undefined })),
      };

      const res = editId ? await updateQuotation(editId, payload as any) : await createQuotation(payload as any);
      const id = res?.id || editId;
      setSuccess("Quotation saved.");
      if (!editId && id) navigate(`/quotations/create?id=${id}`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save quotation");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-20 text-center font-black uppercase text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title={editId ? "Edit Quotation" : "Create Quotation"}
        description="Prepare a proposal for your customer."
        actions={
          <Link to="/quotations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[32px] border bg-white p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <FileSignature className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-widest text-slate-800">Quotation Header</div>
                  <div className="text-xs text-slate-500">Customer, dates and reference fields.</div>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => setAddCustomerOpen(true)} className="rounded-2xl h-11 px-4 text-xs font-black uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <SearchableSelect
                  label="Customer"
                  valueId={form.partyId}
                  onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                  options={parties}
                  placeholder="Select customer..."
                />
              </div>
              <DualDateInput label="Quotation Date" value={form.quotationDate} onChange={(d) => setForm((f) => ({ ...f, quotationDate: d }))} />
              <DualDateInput label="Valid Until" value={form.expiryDate} onChange={(d) => setForm((f) => ({ ...f, expiryDate: d }))} />
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Reference No</span>
                <Input value={form.referenceNo} onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))} placeholder="Optional" />
              </label>
            </div>
          </div>

          <div className="rounded-[32px] border bg-white p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black uppercase tracking-widest text-slate-800">Line Items</div>
              <Button type="button" variant="outline" onClick={() => setAddItemOpen(true)} className="rounded-2xl h-11 px-4 text-xs font-black uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    <SearchableSelect
                      label={idx === 0 ? "Item" : undefined}
                      valueId={l.itemId}
                      onChange={(id, opt) => updateLine(idx, { itemId: id, rate: opt?.salesPrice?.toString() || l.rate })}
                      options={items}
                      placeholder="Select item..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Qty</label>
                    <Input value={l.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} className="h-10 rounded-xl text-right" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rate</label>
                    <Input value={l.rate} onChange={(e) => updateLine(idx, { rate: e.target.value })} className="h-10 rounded-xl text-right" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addLine} className="rounded-2xl h-11 px-6 text-xs font-black uppercase tracking-widest w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </div>

          <div className="rounded-[32px] border bg-white p-8 shadow-sm space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Terms</label>
            <textarea
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              placeholder="Terms and conditions..."
              className="min-h-[110px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] bg-slate-900 text-white p-8 shadow-2xl space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Summary</div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Total</span>
              <span className="text-3xl font-black tabular-nums tracking-tighter">
                <MoneyText value={subtotal} />
              </span>
            </div>
          </div>

          {(error || success) && (
            <div className={cn("rounded-2xl border p-4 text-sm", error ? "border-red-600/30 bg-red-600/10 text-red-700" : "border-emerald-600/30 bg-emerald-600/10 text-emerald-700")}>
              {error || success}
            </div>
          )}

          <Button onClick={onSave} disabled={loading} className="w-full rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-xl bg-indigo-600 hover:bg-indigo-700">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Quotation"}
          </Button>
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={(it) => {
          setItems((prev) => [...prev, it]);
          setAddItemOpen(false);
        }}
      />
      <AddCustomerDialog
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSuccess={(p) => {
          setParties((prev) => [...prev, p]);
          setForm((f) => ({ ...f, partyId: p.id }));
          setAddCustomerOpen(false);
        }}
      />
    </div>
  );
}
