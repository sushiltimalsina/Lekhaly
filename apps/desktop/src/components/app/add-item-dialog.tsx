// apps/desktop/src/components/app/add-item-dialog.tsx
import * as React from "react";
import { X, PackagePlus, Barcode, Tag, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItem } from "@/lib/api/items";

export default function AddItemDialog({
    open,
    onClose,
    onSuccess
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: (item: any) => void;
}) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        name: "",
        sku: "",
        barcode: "",
        salePrice: "0",
        purchasePrice: "0",
        openingStock: "0"
    });

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await createItem({
                ...form,
                salePrice: Number(form.salePrice),
                purchasePrice: Number(form.purchasePrice),
                openingStock: Number(form.openingStock),
                type: "goods"
            });
            onSuccess(res);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "Failed to create item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <PackagePlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">New Inventory Entry</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manual Stock Registration</p>
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Item/Service Name *</label>
                            <Input
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Public Name"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">SKU / Item Code</label>
                            <Input
                                value={form.sku}
                                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                                placeholder="Internal SKU"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Barcode (EAN/UPC)</label>
                            <Input
                                value={form.barcode}
                                onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                                placeholder="Scan Barcode"
                                className="h-11 rounded-2xl"
                            />
                        </div>
                        <div className="col-span-2 h-px bg-slate-50 my-2" />
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Default Selling Rate</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={form.salePrice}
                                    onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                                    className="h-11 rounded-2xl pl-10 font-bold"
                                />
                                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Cost Price (Valuation)</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={form.purchasePrice}
                                    onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))}
                                    className="h-11 rounded-2xl pl-10 font-bold"
                                />
                                <Calculator className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                        </div>
                        <div className="col-span-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Initial Opening Stock Balance</label>
                             <Input
                                type="number"
                                value={form.openingStock}
                                onChange={e => setForm(f => ({ ...f, openingStock: e.target.value }))}
                                className="h-11 rounded-2xl font-bold"
                             />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-11 px-6 font-black text-[10px] uppercase tracking-widest">
                            Dismiss
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-2xl h-11 px-10 bg-amber-600 text-white shadow-xl shadow-amber-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                            {loading ? "Registering..." : "Commit Inventory"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
