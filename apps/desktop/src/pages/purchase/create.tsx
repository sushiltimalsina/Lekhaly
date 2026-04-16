// apps/desktop/src/pages/purchase/create.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { DualDateInput } from "@/components/app/dual-date-input";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import { createVoucherDraft, postVoucher, getVoucher, updateVoucherDraft } from "@/lib/api/vouchers";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddVendorDialog from "@/components/app/add-vendor-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import SearchableSelect from "@/components/app/searchable-select";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Building2,
  Calendar,
  ArrowLeft,
  LayoutGrid,
  Calculator,
  User,
  ShoppingBag
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adToBs } from "@/lib/dates/convert";

type Line = { itemId: string; qty: string; rate: string; description?: string; expenseAccountId?: string };
type BillSundryRow = { id: string; sundryId?: string; name: string; type: "add" | "less"; ratePct: string; manualAmount?: string; isManual?: boolean };

export default function PurchaseCreatePage({ mode = "purchase" }: { mode?: "purchase" | "purchase_return" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const baseRoute = mode === "purchase_return" ? "/purchase-return" : "/purchase";

  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addVendorOpen, setAddVendorOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    partyId: "",
    payableAccountId: "",
    purchaseDate: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
    vendorInvoiceDate: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
    vendorInvoiceNo: "",
    referenceNo: "",
    memo: "",
    notes: "",
    purchaseType: "vat_13"
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);
  const [billSundries, setBillSundries] = React.useState<BillSundryRow[]>([
    { id: "discount", name: "Discount", type: "less", ratePct: "0" },
    { id: "vat", name: "VAT", type: "add", ratePct: "13" },
  ]);

  const loadDependencies = async () => {
    try {
      const [p, a, i, s] = await Promise.all([
        listParties({ type: "supplier", take: 200 }),
        listAccounts({ type: "liability", take: 200 }),
        listItems({ take: 500 }),
        listBillSundries({ take: 100 })
      ]);
      setParties(p || []);
      setAccounts(a || []);
      setItems(i || []);
      setSundryOptions(s || []);
    } catch (e) { console.error(e); }
  };

  const loadVoucher = async (id: string) => {
    setFetching(true);
    try {
      const v = await getVoucher(id);
      setForm({
        partyId: v.partyId || "",
        payableAccountId: v.lines.find((l: any) => l.credit > 0 && !l.itemId)?.accountId || "",
        purchaseDate: { ad: v.voucherDate.split('T')[0], bs: v.voucherDateBs },
        vendorInvoiceDate: { 
            ad: v.vendorInvoiceDate?.split('T')[0] || v.voucherDate.split('T')[0], 
            bs: v.vendorInvoiceDateBs || v.voucherDateBs 
        },
        vendorInvoiceNo: v.vendorInvoiceNo || "",
        referenceNo: v.referenceNo || "",
        memo: v.memo || "",
        notes: v.additionalNote || "",
        purchaseType: "vat_13"
      });

      const itemLines = v.lines.filter((l: any) => l.itemId).map((l: any) => ({
        itemId: l.itemId,
        qty: String(l.qty),
        rate: String(l.debit / l.qty),
        description: l.description,
        expenseAccountId: l.accountId
      }));
      if (itemLines.length) setLines(itemLines);

      const sundryLines = v.lines.filter((l: any) => !l.itemId && l.credit < (v.lines.find((lx: any) => lx.credit > 0 && !lx.itemId)?.credit || 0));
      // Simplifying sundry load for port
    } catch (e) { setError("Failed to load purchase voucher"); }
    finally { setFetching(false); }
  };

  React.useEffect(() => {
    loadDependencies();
    if (editId) loadVoucher(editId);
  }, [editId]);

  const itemsSubtotal = lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  const total = itemsSubtotal + billSundries.reduce((sum, r) => {
      const pct = Number(r.ratePct || 0);
      const amt = r.isManual ? Number(r.manualAmount || 0) : (itemsSubtotal * pct) / 100;
      return sum + (r.type === "add" ? amt : -amt);
  }, 0);

  const removeSundry = (id: string) => {
      setBillSundries(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async (post = false) => {
    setError(null);
    setLoading(true);
    try {
      const payloadLines = lines.filter(l => l.itemId).map(l => ({
          itemId: l.itemId,
          qty: Number(l.qty),
          debit: Number(l.qty) * Number(l.rate),
          description: l.description || "Purchase"
      }));

      // Add Credit line for Payable
      payloadLines.push({
          accountId: form.payableAccountId,
          credit: total,
          debit: 0,
          description: form.memo || "Purchase from vendor",
      } as any);

      const payload = {
        voucherType: mode,
        voucherDate: form.purchaseDate.ad,
        voucherDateBs: form.purchaseDate.bs,
        partyId: form.partyId,
        vendorInvoiceNo: form.vendorInvoiceNo,
        vendorInvoiceDate: form.vendorInvoiceDate.ad,
        referenceNo: form.referenceNo,
        memo: form.memo,
        additionalNote: form.notes,
        lines: payloadLines
      };

      let res;
      if (editId) res = await updateVoucherDraft(editId, payload);
      else res = await createVoucherDraft(payload);
      
      const id = res?.id || editId;
      if (post && id) {
          await postVoucher(id);
          setSuccess("Purchase bill committed to ledger.");
          setTimeout(() => navigate(baseRoute), 1500);
      } else {
          setSuccess("Purchase draft saved.");
          if (!editId && id) navigate(`${baseRoute}/create?id=${id}`, { replace: true });
      }
    } catch (e: any) { setError(e?.message || "Operation failed"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="p-20 text-center font-black uppercase text-slate-400">Loading Purchase Record...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/purchase")} className="rounded-full h-10 px-4 text-slate-500">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
          </Button>
          <div className="flex gap-3">
              <Button onClick={() => handleSave(false)} disabled={loading} variant="outline" className="h-11 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                  <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={loading} className="h-11 px-8 rounded-2xl bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100">
                  <Send className="mr-2 h-4 w-4" /> Commit Bill
              </Button>
          </div>
      </div>

      <PageHeader 
        title={editId ? "Edit Purchase Bill" : "Inward Purchase Sequence"} 
        description="Register a new vendor invoice and update inventory stock levels." 
      />

      {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-[20px] text-[11px] font-black text-rose-600 uppercase tracking-widest animate-shake"> {error} </div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[20px] text-[11px] font-black text-emerald-600 uppercase tracking-widest animate-fade-in"> {success} </div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {/* Vendor & Schedule */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 border-b pb-6">
                      <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center"><User className="h-5 w-5" /></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Supplier/Vendor Registry</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                          <SearchableSelect
                            label="Supplier Entity"
                            valueId={form.partyId}
                            options={parties}
                            onChange={(id) => setForm(f => ({ ...f, partyId: id }))}
                            placeholder="Identify supplier..."
                            leftIcon={<Building2 className="h-4 w-4" />}
                          />
                          <Button variant="ghost" onClick={() => setAddVendorOpen(true)} className="h-8 px-3 rounded-lg text-[9px] font-black uppercase text-orange-600 hover:bg-orange-50">
                              + Register New Vendor
                          </Button>
                      </div>
                      <div className="space-y-4">
                          <SearchableSelect
                            label="Liability Account"
                            valueId={form.payableAccountId}
                            options={accounts}
                            onChange={(id) => setForm(f => ({ ...f, payableAccountId: id }))}
                            placeholder="Select payable account..."
                            leftIcon={<LayoutGrid className="h-4 w-4" />}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Vendor Invoice Number *</label>
                          <Input 
                            required 
                            value={form.vendorInvoiceNo} 
                            onChange={e => setForm(f => ({ ...f, vendorInvoiceNo: e.target.value }))}
                            placeholder="Invoice No. from Vendor"
                            className="h-11 rounded-2xl border-orange-100 focus:border-orange-200"
                          />
                      </div>
                      <DualDateInput 
                        label="Vendor Invoice Date" 
                        value={form.vendorInvoiceDate} 
                        onChange={(d) => setForm(f => ({ ...f, vendorInvoiceDate: d }))} 
                        accentColor="bg-orange-600"
                      />
                  </div>
              </div>

              {/* Items Table */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm">
                  <div className="flex items-center justify-between mb-8 border-b pb-6">
                      <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center"><ShoppingBag className="h-5 w-5" /></div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Stock Inward Ledger</h4>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {lines.map((line, idx) => (
                          <div key={idx} className="flex gap-4 items-end group">
                              <div className="flex-1">
                                  <SearchableSelect
                                    placeholder="Identify item..."
                                    valueId={line.itemId}
                                    options={items}
                                    onChange={(id, opt) => {
                                        setLines(prev => prev.map((l, i) => i === idx ? { ...l, itemId: id, rate: String(opt?.purchasePrice || 0) } : l));
                                    }}
                                    getDetail={(opt) => `Cost: ${opt.purchasePrice}`}
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
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Purchase Rate</label>
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
                    className="mt-8 h-12 w-full border-dashed rounded-[20px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-orange-600 hover:border-orange-600 transition-all"
                  >
                      + Add Purchase Line
                  </Button>
              </div>
          </div>

          <div className="space-y-8">
              {/* Summary Audit */}
              <div className="p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-white/5 pb-4">Accounts Payable Summary</div>
                  <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Gross Material Value</span>
                          <span><MoneyText value={itemsSubtotal} /></span>
                      </div>
                      <div className="space-y-3">
                          {billSundries.map((sn, idx) => {
                              const pct = Number(sn.ratePct || 0);
                              const amt = sn.isManual ? Number(sn.manualAmount || 0) : (itemsSubtotal * pct) / 100;
                              return (
                                  <div key={sn.id} className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide group/sundry">
                                      <div className="flex items-center gap-2">
                                          <span className={sn.type === "add" ? "text-orange-400" : "text-rose-400"}>
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
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">Total Liability</span>
                          <span className="text-3xl font-black tabular-nums tracking-tighter"><MoneyText value={total} /></span>
                      </div>
                  </div>
              </div>

              {/* Metadata */}
              <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2 border-b pb-4">Purchase Context</div>
                  <div className="space-y-4">
                      <DualDateInput 
                        label="Internal Record Date" 
                        value={form.purchaseDate} 
                        onChange={(d) => setForm(f => ({ ...f, purchaseDate: d }))} 
                      />
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sequence Explanation (Memo)</label>
                        <textarea 
                            value={form.memo} 
                            onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                            placeholder="Identify this purchase sequence..."
                            className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                        />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onSuccess={(it) => { setItems(prev => [...prev, it]); setAddItemOpen(false); }} />
      <AddVendorDialog open={addVendorOpen} onClose={() => setAddVendorOpen(false)} onSuccess={(p) => { setParties(prev => [...prev, p]); setAddVendorOpen(false); }} />
      <AddBillSundryDialog open={addSundryOpen} onClose={() => setAddSundryOpen(false)} onSuccess={(s) => { setSundryOptions(prev => [...prev, s]); setAddSundryOpen(false); }} />
    </div>
  );
}
