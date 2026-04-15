// apps/desktop/src/components/app/add-bill-sundry-dialog.tsx
import * as React from "react";
import { X, Percent, PlusCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBillSundry } from "@/lib/api/bill-sundries";
import { cn } from "@/lib/utils";

export default function AddBillSundryDialog({
    open,
    onClose,
    onSuccess
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: (sundry: any) => void;
}) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        name: "",
        type: "add" as "add" | "less",
        defaultRate: "0"
    });

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await createBillSundry({
                ...form,
                rate: Number(form.defaultRate)
            });
            onSuccess(res);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create bill sundry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                            <PlusCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Add Bill Sundry</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ledger Adjustment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-black text-rose-500 uppercase tracking-wide">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Sundry Name *</label>
                            <Input
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Rounding, Service Charge"
                                className="h-11 rounded-2xl"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Adjustment Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: "add" }))}
                                    className={cn(
                                        "h-11 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        form.type === "add" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <PlusCircle className="h-4 w-4" /> Additive
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, type: "less" }))}
                                    className={cn(
                                        "h-11 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        form.type === "less" ? "bg-rose-500 text-white shadow-lg shadow-rose-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <MinusCircle className="h-4 w-4" /> Deductive
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Default Calculation (%)</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={form.defaultRate}
                                    onChange={e => setForm(f => ({ ...f, defaultRate: e.target.value }))}
                                    className="h-11 rounded-2xl pl-10 font-bold"
                                />
                                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-11 px-6 font-black text-[10px] uppercase tracking-widest"> Dismiss </Button>
                        <Button type="submit" disabled={loading} className="rounded-2xl h-11 flex-1 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                            {loading ? "Registry Audit..." : "Commit Sundry"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
