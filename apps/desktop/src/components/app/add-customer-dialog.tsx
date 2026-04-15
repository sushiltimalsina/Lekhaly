// apps/desktop/src/components/app/add-customer-dialog.tsx
import * as React from "react";
import { X, UserPlus, Building2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createParty } from "@/lib/api/parties";

export default function AddCustomerDialog({
    open,
    onClose,
    onSuccess
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: (party: any) => void;
}) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        panVat: ""
    });

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await createParty({
                ...form,
                type: "customer"
            });
            onSuccess(res);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">New Customer Registry</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manual Entry for Ledger</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-black text-rose-500 uppercase tracking-wide">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Customer/Entity Name *</label>
                            <Input
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Business or Individual Name"
                                className="h-11 rounded-2xl border-slate-200 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Contact Person</label>
                            <Input
                                value={form.contactPerson}
                                onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                                placeholder="Name"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">PAN/VAT Number</label>
                            <Input
                                value={form.panVat}
                                onChange={e => setForm(f => ({ ...f, panVat: e.target.value }))}
                                placeholder="9 Digits"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Primary Phone</label>
                            <Input
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="98XXXXXXXX"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Email Address</label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="example@lekhaly.com"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Physical Address</label>
                            <Input
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="Building, Street, City"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 Pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-11 px-6 font-black text-[10px] uppercase tracking-widest">
                            Dismiss
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-2xl h-11 px-10 bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                            {loading ? "Registering..." : "Commit Customer"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
