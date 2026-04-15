// apps/desktop/src/pages/sales/create.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { DualDateInput } from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import { createInvoiceDraft, postInvoice, getInvoice, updateInvoiceDraft } from "@/lib/api/invoices";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddCustomerDialog from "@/components/app/add-customer-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import SearchableSelect from "@/components/app/searchable-select";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Building2,
  Calendar,
  FileText,
  ArrowLeft,
  LayoutGrid,
  Calculator,
  User
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adToBs } from "@/lib/dates/convert";

type Line = { itemId: string; qty: string; rate: string; description?: string };
type BillSundryRow = { id: string; sundryId?: string; name: string; type: "add" | "less"; ratePct: string; manualAmount?: string; isManual?: boolean };

export default function SalesCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    partyId: "",
    receivableAccountId: "",
    invoiceDate: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
    dueDate: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
    referenceNo: "",
    memo: "",
    notes: "",
    salesType: "vat_13"
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);
  const [billSundries, setBillSundries] = React.useState<BillSundryRow[]>([
    { id: "discount", name: "Discount", type: "less", ratePct: "0" },
    { id: "vat", name: "VAT", type: "add", ratePct: "13" },
  ]);

  const loadDependencies = async () => {
    try {
      const [p, a, i, s] = await Promise.all([
        listParties({ type: "customer", take: 200 }),
        listAccounts({ type: "asset", take: 200 }),
        listItems({ take: 500 }),
        listBillSundries({ take: 100 })
      ]);
      setParties(p || []);
      setAccounts(a || []);
      setItems(i || []);
      setSundryOptions(s || []);
    } catch (e) { console.error(e); }
  };

  const loadInvoice = async (id: string) => {
    setFetching(true);
    try {
      const inv = await getInvoice(id);
      setForm({
        partyId: inv.partyId,
        receivableAccountId: inv.receivableAccountId,
        invoiceDate: { ad: inv.date.split('T')[0], bs: inv.dateBs },
        dueDate: { ad: inv.dueDate.split('T')[0], bs: inv.dueDateBs },
        referenceNo: inv.referenceNo || "",
        memo: inv.memo || "",
        notes: inv.additionalNote || "",
        salesType: inv.salesType || "vat_13"
      });
      setLines(inv.items.map((it: any) => ({
        itemId: it.itemId,
        qty: String(it.qty),
        rate: String(it.rate),
        description: it.description
      })));
      if (inv.sundries?.length) {
          setBillSundries(inv.sundries.map((sn: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              sundryId: sn.billSundryId,
              name: sn.name,
              type: sn.type,
              ratePct: String(sn.rate || "0"),
              manualAmount: String(sn.amount || "0"),
              isManual: true
          })));
      }
    } catch (e) { setError("Failed to load invoice for editing"); }
    finally { setFetching(false); }
  };

  React.useEffect(() => {
    loadDependencies();
    if (editId) loadInvoice(editId);
  }, [editId]);

  const itemsSubtotal = lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  const sundryNet = billSundries.reduce((sum, r) => {
      const pct = Number(r.ratePct || 0);
      const amt = r.isManual ? Number(r.manualAmount || 0) : (itemsSubtotal * pct) / 100;
      return sum + (r.type === "add" ? amt : -amt);
  }, 0);

  const removeSundry = (id: string) => {
      setBillSundries(prev => prev.filter(s => s.id !== id));
  };

  const total = itemsSubtotal + sundryNet;

  const handleSave = async (post = false) => {
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        type: "sales" as const,
        date: form.invoiceDate.ad,
        dateBs: form.invoiceDate.bs,
        dueDate: form.dueDate.ad,
        dueDateBs: form.dueDate.bs,
        additionalNote: form.notes,
        items: lines.filter(l => l.itemId && Number(l.qty) > 0).map(l => ({
          itemId: l.itemId,
          qty: Number(l.qty),
          rate: Number(l.rate),
          description: l.description
        })),
        sundries: billSundries.map(r => ({
            billSundryId: r.sundryId,
            name: r.name,
            type: r.type,
            rate: Number(r.ratePct),
            amount: r.isManual ? Number(r.manualAmount) : (itemsSubtotal * Number(r.ratePct)) / 100
        })).filter(s => Math.abs(s.amount) > 0.01)
      };

      let res;
      if (editId) res = await updateInvoiceDraft(editId, payload);
      else res = await createInvoiceDraft(payload);
      
      const id = res?.id || editId;
      if (post && id) {
          await postInvoice(id);
          setSuccess("Invoice committed to ledger successfully.");
          setTimeout(() => navigate("/sales"), 1500);
      } else {
          setSuccess("Draft audit saved.");
          if (!editId && id) navigate(`/sales/create?id=${id}`, { replace: true });
      }
    } catch (e: any) { setError(e?.message || "Operation failed"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="p-20 text-center font-black uppercase text-slate-400">Loading Registry Details...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/sales")} className="rounded-full h-10 px-4 text-slate-500">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
          </Button>
          <div className="flex gap-3">
              <Button onClick={() => handleSave(false)} disabled={loading} variant="outline" className="h-11 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                  <Save className="mr-2 h-4 w-4" /> Save Sequence
              </Button>
              <Button onClick={() => handleSave(true)} disabled={loading} className="h-11 px-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">
                  <Send className="mr-2 h-4 w-4" /> Commit to Ledger
              </Button>
          </div>
      </div>

      <PageHeader 
        title={editId ? "Edit Sales Audit" : "New Sales Sequence"} 
        description="Initialize a new transaction record in the centralized audit ledger." 
      />

      {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-[20px] text-[11px] font-black text-rose-600 uppercase tracking-widest animate-shake">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[20px] text-[11px] font-black text-emerald-600 uppercase tracking-widest animate-fade-in">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {/* Entity Selection & Schedule */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 border-b pb-6">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><User className="h-5 w-5" /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Primary Entity Registry</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                          <SearchableSelect
                            label="Customer / Debtor Entity"
                            valueId={form.partyId}
                            options={parties}
                            onChange={(id) => setForm(f => ({ ...f, partyId: id }))}
                            placeholder="Identify customer..."
                            leftIcon={<Building2 className="h-4 w-4" />}
                          />
                          <Button variant="ghost" onClick={() => setAddCustomerOpen(true)} className="h-8 px-3 rounded-lg text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50">
                              + Register New Customer
                          </Button>
                      </div>
                      <div className="space-y-4">
                          <SearchableSelect
                            label="Settlement Account"
                            valueId={form.receivableAccountId}
                            options={accounts}
                            onChange={(id) => setForm(f => ({ ...f, receivableAccountId: id }))}
                            placeholder="Select ledger account..."
                            leftIcon={<LayoutGrid className="h-4 w-4" />}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      <DualDateInput 
                        label="Audit Entry Date" 
                        value={form.invoiceDate} 
                        onChange={(d) => setForm(f => ({ ...f, invoiceDate: d }))} 
                        accentColor="bg-indigo-600"
                      />
                      <DualDateInput 
                        label="Maturity / Due Date" 
                        value={form.dueDate} 
                        onChange={(d) => setForm(f => ({ ...f, dueDate: d }))} 
                        accentColor="bg-rose-500"
                      />
                  </div>
              </div>

              {/* Line Items Ledger */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm">
                  <div className="flex items-center justify-between mb-8 border-b pb-6">
                      <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Calculator className="h-5 w-5" /></div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Transaction Units</h4>
                      </div>
                      <Button variant="ghost" onClick={() => setAddItemOpen(true)} className="h-9 px-4 rounded-xl text-[9px] font-black uppercase text-amber-600 hover:bg-amber-50">
                          + Register New Unit
                      </Button>
                  </div>

                  <div className="space-y-4">
                      {lines.map((line, idx) => (
                          <div key={idx} className="flex gap-4 items-end group">
                              <div className="flex-1">
                                  <SearchableSelect
                                    placeholder="Identify unit/item..."
                                    valueId={line.itemId}
                                    options={items}
                                    onChange={(id, opt) => {
                                        setLines(prev => prev.map((l, i) => i === idx ? { ...l, itemId: id, rate: String(opt?.salesPrice || 0) } : l));
                                    }}
                                    getDetail={(opt) => `Rate: ${opt.salesPrice}`}
                                  />
                              </div>
                              <div className="w-24">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Qty</label>
                                  <Input 
                                    type="number" 
                                    value={line.qty} 
                                    onChange={e => setLines(prev => prev.map((l, i) => i === idx ? { ...l, qty: e.target.value } : l))}
                                    className="h-10 rounded-xl font-bold"
                                  />
                              </div>
                              <div className="w-32">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rate</label>
                                  <Input 
                                    type="number" 
                                    value={line.rate} 
                                    onChange={e => setLines(prev => prev.map((l, i) => i === idx ? { ...l, rate: e.target.value } : l))}
                                    className="h-10 rounded-xl font-bold"
                                  />
                              </div>
                              <div className="w-32 text-right self-center pt-5">
                                  <span className="text-[11px] font-black text-slate-900 tabular-nums">
                                      <MoneyText value={Number(line.qty || 0) * Number(line.rate || 0)} />
                                  </span>
                              </div>
                              <button 
                                onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}
                                className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                  <Trash2 className="h-4 w-4" />
                              </button>
                          </div>
                      ))}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => setLines(prev => [...prev, { itemId: "", qty: "", rate: "" }])}
                    className="mt-8 h-12 w-full border-dashed rounded-[20px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all"
                  >
                      + Add Item Sequence
                  </Button>
              </div>
          </div>

          <div className="space-y-8">
              {/* Summary Audit */}
              <div className="p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-white/5 pb-4">Audit Summary</div>
                  <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Gross Sequence Value</span>
                          <span><MoneyText value={itemsSubtotal} /></span>
                      </div>
                      <div className="space-y-3">
                          {billSundries.map((sn, idx) => {
                              const pct = Number(sn.ratePct || 0);
                              const amt = sn.isManual ? Number(sn.manualAmount || 0) : (itemsSubtotal * pct) / 100;
                              return (
                                  <div key={sn.id} className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide group/sundry">
                                      <div className="flex items-center gap-2">
                                          <span className={sn.type === "add" ? "text-indigo-400" : "text-rose-400"}>
                                              {sn.type === "add" ? "+" : "-"}
                                          </span>
                                          <span className="text-slate-500">{sn.name}</span>
                                          <span className="text-slate-600 text-[8px]">({sn.ratePct}%)</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className={sn.type === "add" ? "text-slate-300" : "text-slate-400"}><MoneyText value={amt} /></span>
                                          <button onClick={() => removeSundry(sn.id)} className="opacity-0 group-hover/sundry:opacity-100 p-1 text-slate-500 hover:text-rose-500 transition-all outline-none">
                                              <Trash2 className="h-3 w-3" />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="h-px bg-white/5 my-4" />
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Net Commitment</span>
                          <span className="text-3xl font-black tabular-nums tracking-tighter"><MoneyText value={total} /></span>
                      </div>
                  </div>
              </div>

              {/* Metadata */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2 border-b pb-4">Internal Metadata</div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Reference Ledger ID</label>
                          <Input 
                            value={form.referenceNo} 
                            onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                            placeholder="Optional ID..."
                            className="h-10 rounded-xl"
                          />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sequence Explanation (Memo)</label>
                        <textarea 
                            value={form.memo} 
                            onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                            placeholder="Brief description of event..."
                            className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Overlays */}
      <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onSuccess={(it) => { setItems(prev => [...prev, it]); setAddItemOpen(false); }} />
      <AddCustomerDialog open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} onSuccess={(p) => { setParties(prev => [...prev, p]); setAddCustomerOpen(false); }} />
      <AddBillSundryDialog open={addSundryOpen} onClose={() => setAddSundryOpen(false)} onSuccess={(s) => { setSundryOptions(prev => [...prev, s]); setAddSundryOpen(false); }} />
    </div>
  );
}
