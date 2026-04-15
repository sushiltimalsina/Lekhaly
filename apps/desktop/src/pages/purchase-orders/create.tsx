// apps/desktop/src/pages/purchase-orders/create.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import {
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    type PurchaseOrderInput
} from "@/lib/api/purchase-orders";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddCustomerDialog from "@/components/app/add-customer-dialog"; // Reusable for supplier
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import SearchableSelect from "@/components/app/searchable-select";
import { DualDateInput } from "@/components/app/dual-date-input";
import {
    Plus,
    Trash2,
    Save,
    Search,
    ChevronDown,
    Check,
    Printer,
    FileText,
    ArrowLeft,
    PackageSearch,
    AlertCircle,
    Truck,
    ShoppingCart,
    Calculator,
    Info,
    User
} from "lucide-react";
import { adToBs, bsToAd } from "@/lib/dates/convert";

type Line = { itemId: string; qty: string; rate: string; description?: string };
type BillSundryRow = { id: string; sundryId?: string; name: string; type: "add" | "less"; ratePct: string; manualAmount?: string; isManual?: boolean };

export default function PurchaseOrderCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");

    const [loading, setLoading] = React.useState(false);
    const [pageLoading, setPageLoading] = React.useState(!!editId);
    const [error, setError] = React.useState<string | null>(null);

    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

    const [addSupplierOpen, setAddSupplierOpen] = React.useState(false);
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [addSundryOpen, setAddSundryOpen] = React.useState(false);

    const [form, setForm] = React.useState({
        partyId: "",
        orderDate: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
        expectedDelivery: { ad: "", bs: "" },
        vendorRef: "",
        memo: "",
        terms: "",
        orderNo: "NEW",
    });

    const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);
    const [billSundries, setBillSundries] = React.useState<BillSundryRow[]>([
        { id: "vat", name: "VAT", type: "add", ratePct: "13" },
    ]);

    React.useEffect(() => {
        const load = async () => {
          try {
            const [p, i, s] = await Promise.all([
              listParties({ type: "supplier" }),
              listItems(),
              listBillSundries()
            ]);
            setParties(p || []);
            setItems(i || []);
            setSundryOptions(s || []);

            if (editId) {
                const po = await getPurchaseOrder(editId);
                setForm({
                    partyId: po.partyId,
                    orderDate: { ad: po.orderDate?.split('T')[0] || "", bs: po.orderDateBs || "" },
                    expectedDelivery: { ad: po.expectedDelivery?.split('T')[0] || "", bs: po.expectedDeliveryBs || "" },
                    vendorRef: po.vendorRef || "",
                    memo: po.memo || "",
                    terms: po.terms || "",
                    orderNo: po.orderNo || "NEW",
                });
                setLines(po.items.map((it: any) => ({
                    itemId: it.itemId,
                    qty: String(it.qty),
                    rate: String(it.rate),
                    description: it.description || ""
                })));
                if (po.sundries?.length) {
                    setBillSundries(po.sundries.map((sn: any) => ({
                        id: Math.random().toString(),
                        sundryId: sn.billSundryId,
                        name: sn.name,
                        type: sn.type,
                        ratePct: String(sn.rate || "0"),
                        manualAmount: String(sn.amount || "0"),
                        isManual: true
                    })));
                }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setPageLoading(false);
          }
        };
        load();
    }, [editId]);

    const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.qty) * parseFloat(l.rate) || 0), 0);
    const sundryNet = billSundries.reduce((sum, r) => {
        const amt = r.isManual ? parseFloat(r.manualAmount || "0") : (subtotal * parseFloat(r.ratePct || "0")) / 100;
        return sum + (r.type === "add" ? amt : -amt);
    }, 0);
    const total = subtotal + sundryNet;

    const addLine = () => setLines([...lines, { itemId: "", qty: "", rate: "" }]);
    const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
    const updateLine = (idx: number, patch: Partial<Line>) => setLines(lines.map((l, i) => i === idx ? { ...l, ...patch } : l));
    const removeSundry = (id: string) => setBillSundries(billSundries.filter(s => s.id !== id));

    const onSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload: PurchaseOrderInput = {
                partyId: form.partyId,
                orderDate: form.orderDate.ad,
                orderDateBs: form.orderDate.bs,
                expectedDelivery: form.expectedDelivery.ad || undefined,
                expectedDeliveryBs: form.expectedDelivery.bs || undefined,
                vendorRef: form.vendorRef || undefined,
                memo: form.memo || undefined,
                terms: form.terms || undefined,
                items: lines.filter(l => l.itemId).map(l => ({
                    itemId: l.itemId,
                    qty: parseFloat(l.qty),
                    rate: parseFloat(l.rate),
                    description: l.description
                })),
                sundries: billSundries.map(s => ({
                    billSundryId: s.sundryId,
                    name: s.name,
                    type: s.type,
                    rate: parseFloat(s.ratePct),
                    amount: s.isManual ? parseFloat(s.manualAmount || "0") : (subtotal * parseFloat(s.ratePct)) / 100
                })).filter(s => Math.abs(s.amount) > 0.01)
            };

            if (editId) await updatePurchaseOrder(editId, payload);
            else await createPurchaseOrder(payload);
            navigate("/purchase-orders");
        } catch (e: any) {
            setError(e?.message ?? "Failed to save purchase order");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="p-10 text-center animate-pulse font-black text-slate-300">SYNCHRONIZING STOCK REGISTRY...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate("/purchase-orders")} className="rounded-full h-10 px-4 text-slate-500 hover:text-orange-600 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
                </Button>
                <div className="flex gap-3">
                    <Button onClick={onSave} disabled={loading} className="h-11 px-8 rounded-2xl bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 italic transition-all active:scale-95 border-none">
                        <Save className="mr-2 h-4 w-4" /> Commit Procurement Order
                    </Button>
                </div>
            </div>

            <PageHeader 
                title={editId ? `Calibrate Order: ${form.orderNo}` : "New Procurement Manifest"} 
                description="Secure inward stock supply by issuing a formal purchase order to your vendor." 
            />

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black text-rose-600 uppercase tracking-widest animate-shake flex items-center gap-3">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Logistics */}
                    <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor / Supplier Identity</label>
                                    <Button variant="ghost" size="sm" onClick={() => setAddSupplierOpen(true)} className="h-6 text-[9px] font-black text-orange-600 uppercase">New Supplier</Button>
                                </div>
                                <SearchableSelect
                                    valueId={form.partyId}
                                    onChange={(id) => setForm(f => ({ ...f, partyId: id }))}
                                    options={parties}
                                    getLabel={p => p.name}
                                    placeholder="Select supplier..."
                                    buttonClassName="h-11 rounded-xl border-slate-100 bg-white font-bold"
                                    leftIcon={<Truck className="h-4 w-4" />}
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor Quotation Reference</label>
                                <Input
                                    value={form.vendorRef}
                                    onChange={(e) => setForm(f => ({ ...f, vendorRef: e.target.value }))}
                                    placeholder="External quote reference..."
                                    className="h-11 rounded-xl border-slate-100 font-bold focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <DualDateInput
                                label="Order Issuance Date"
                                value={form.orderDate}
                                onChange={(d) => setForm(f => ({ ...f, orderDate: d }))}
                                accentColor="bg-orange-600"
                            />
                            <DualDateInput
                                label="Expected Inward Delivery"
                                value={form.expectedDelivery}
                                onChange={(d) => setForm(f => ({ ...f, expectedDelivery: d }))}
                                accentColor="bg-emerald-600"
                            />
                        </div>
                    </div>

                    {/* Stock Registry Table */}
                    <div className="bg-white rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Stock Resource Profile</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-24 text-center">Volume</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32 text-right">Unit Factor</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32 text-right">Valuation</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-black text-slate-300">{idx + 1}</td>
                                        <td className="px-2 py-4">
                                            <SearchableSelect
                                                valueId={line.itemId}
                                                onChange={(id, opt) => updateLine(idx, { itemId: id, rate: opt?.purchasePrice?.toString() || line.rate })}
                                                options={items}
                                                getLabel={i => i.name}
                                                placeholder="Identify item..."
                                                buttonClassName="h-10 rounded-xl border-slate-100 bg-transparent font-bold"
                                            />
                                        </td>
                                        <td className="px-2 py-4">
                                            <Input
                                                type="number"
                                                value={line.qty}
                                                onChange={(e) => updateLine(idx, { qty: e.target.value })}
                                                className="h-10 rounded-xl text-center font-black border-slate-100 focus:border-orange-500 transition-all"
                                            />
                                        </td>
                                        <td className="px-2 py-4">
                                            <Input
                                                type="number"
                                                value={line.rate}
                                                onChange={(e) => updateLine(idx, { rate: e.target.value })}
                                                className="h-10 rounded-xl text-right font-black border-slate-100 focus:border-orange-500 transition-all"
                                            />
                                        </td>
                                        <td className="px-2 py-4 text-right font-black text-slate-900 tabular-nums">
                                            <MoneyText value={parseFloat(line.qty) * parseFloat(line.rate) || 0} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => removeLine(idx)} disabled={lines.length === 1} className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 disabled:hidden">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 bg-slate-50/20 border-t border-slate-100 flex justify-between gap-4">
                             <Button variant="outline" onClick={addLine} className="h-12 flex-1 rounded-2xl border-dashed border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-600 hover:border-orange-100 hover:bg-orange-50/30 transition-all">
                                <Plus className="mr-2 h-4 w-4" /> Append Manifest Entry
                             </Button>
                             <Button variant="outline" onClick={() => setAddItemOpen(true)} className="h-12 w-12 rounded-2xl border-2 border-slate-100 text-orange-600 hover:bg-slate-50">
                                <PackageSearch className="h-4 w-4" />
                             </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Financial Summary */}
                    <div className="p-8 bg-orange-600 rounded-[32px] text-white shadow-2xl relative overflow-hidden group border-none">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Calculator className="h-24 w-24" /></div>
                        <div className="space-y-5 relative z-10">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-orange-200 mb-6">
                                <span>Procurement Summary</span>
                                <span className="italic uppercase">Inward Analytics</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-orange-200/80 font-mono">
                                <span>Base Subtotal</span>
                                <span><MoneyText value={subtotal} /></span>
                            </div>
                            
                            <div className="space-y-3 py-4 border-y border-white/20">
                                {billSundries.map((row) => (
                                    <div key={row.id} className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-orange-200">
                                                <span>{row.name} {row.ratePct ? `(${row.ratePct}%)` : ""}</span>
                                                <span className={row.type === 'less' ? "text-rose-200" : "text-emerald-200 italic"}>
                                                    {row.type === 'less' ? "- " : "+ "}
                                                    <MoneyText value={row.isManual ? parseFloat(row.manualAmount || "0") : (subtotal * parseFloat(row.ratePct || "0")) / 100} />
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeSundry(row.id)} className="text-white/40 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={() => setAddSundryOpen(true)} className="h-8 w-full border border-dashed border-white/20 rounded-xl text-[9px] font-black text-orange-200 hover:text-white uppercase hover:bg-white/5">Adjust Reconciliation</Button>
                            </div>

                            <div className="pt-4 flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">Total Commitment</span>
                                    <div className="text-4xl font-black tabular-nums tracking-tighter"><MoneyText value={total} /></div>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-xl shadow-orange-900/10"><ShoppingCart className="h-8 w-8" /></div>
                            </div>
                        </div>
                    </div>

                    {/* Meta/Narrations */}
                    <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><FileText className="h-3 w-3" /> External Engagement Terms</label>
                            <textarea
                                value={form.terms}
                                onChange={(e) => setForm(f => ({ ...f, terms: e.target.value }))}
                                placeholder="Terms and conditions for this inward order..."
                                className="min-h-[100px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4 text-xs outline-none focus:border-orange-500 focus:bg-white transition-all font-medium resize-none shadow-inner"
                            />
                        </div>
                        <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Info className="h-3 w-3" /> Auditor Registry Notes</label>
                            <textarea
                                value={form.memo}
                                onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                placeholder="Internal processing remarks..."
                                className="min-h-[100px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4 text-xs outline-none focus:border-orange-500 focus:bg-white transition-all font-medium resize-none shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AddCustomerDialog open={addSupplierOpen} onClose={() => setAddSupplierOpen(false)} onSuccess={(p) => setParties([...parties, p])} />
            <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onSuccess={(i) => setItems([...items, i])} />
            <AddBillSundryDialog 
                open={addSundryOpen} 
                onClose={() => setAddSundryOpen(false)} 
                onSuccess={(opt) => {
                    setBillSundries([
                        ...billSundries, 
                        { 
                            id: Math.random().toString(), 
                            sundryId: opt.id, 
                            name: opt.name, 
                            type: opt.type as "add" | "less", 
                            ratePct: String(opt.rate || "0"), 
                            manualAmount: "0", 
                            isManual: false 
                        }
                    ]);
                    setAddSundryOpen(false);
                }} 
            />
        </div>
    );
}
