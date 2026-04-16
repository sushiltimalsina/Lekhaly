"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createBillSundry } from "@/lib/api/bill-sundries";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { X, Save, Calculator, Plus, Minus, Search } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type AddBillSundryDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (sundry: any) => void;
};

export default function AddBillSundryDialog({ open, onClose, onSuccess }: AddBillSundryDialogProps) {
    const [name, setName] = React.useState("");
    const [type, setType] = React.useState<"add" | "less">("add");
    const [rate, setRate] = React.useState("");
    const [accountId, setAccountId] = React.useState("");
    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            loadAccounts();
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    async function loadAccounts() {
        try {
            const res: any = await listAccounts({ take: 500 });
            setAccounts(Array.isArray(res) ? res : res?.items ?? res?.data ?? []);
        } catch (e) {
            console.error("Failed to load accounts", e);
        }
    }

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const res = await createBillSundry({
                name: name.trim(),
                type,
                rate: rate ? parseFloat(rate) : null,
                accountId: accountId || null
            });
            onSuccess(res);
            onClose();
            setName("");
            setRate("");
            setAccountId("");
            setType("add");
        } catch (err: any) {
            setError(err?.message ?? "Failed to create bill sundry");
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/30">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Add New Bill Sundry</h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50 animate-in shake-in">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Sundry Name</span>
                            <Input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Freight, Packing Charges, Discount"
                                className="h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Calculation Type</span>
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setType("add")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                                            type === "add" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-slate-500"
                                        )}
                                    >
                                        <Plus className="h-3 w-3" />
                                        ADD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType("less")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                                            type === "less" ? "bg-white dark:bg-slate-800 shadow-sm text-red-600" : "text-slate-500"
                                        )}
                                    >
                                        <Minus className="h-3 w-3" />
                                        LESS
                                    </button>
                                </div>
                            </div>

                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Default Rate (%)</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50"
                                />
                            </label>
                        </div>

                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-tight">Ledger Account (Optional)</span>
                            <div className="relative">
                                <select
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                    className="w-full h-11 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 px-4 text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                >
                                    <option value="">Select Ledger Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-6 rounded-2xl text-[11px] font-bold border hover:bg-slate-50 dark:hover:bg-slate-900 transition-all tracking-wider"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 px-8 rounded-2xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 tracking-wider"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "SAVING..." : "SAVE SUNDRY"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
