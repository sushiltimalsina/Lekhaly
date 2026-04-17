"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createBillSundry, updateBillSundry, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { X, Save, Calculator, Plus, Minus, Search } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type AddBillSundryDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (sundry: any) => void;
    sundry?: BillSundryRecord;
};

export default function AddBillSundryDialog({ open, onClose, onSuccess, sundry }: AddBillSundryDialogProps) {
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
            if (sundry) {
                setName(sundry.name);
                setType(sundry.type);
                setRate(sundry.rate?.toString() ?? "");
                setAccountId(sundry.accountId ?? "");
            }
        } else {
            document.body.style.overflow = "unset";
            setName("");
            setRate("");
            setAccountId("");
            setType("add");
            setError(null);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open, sundry]);

    async function loadAccounts() {
        try {
            const res: any = await listAccounts({ take: 200 });
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
            let res;
            const input = {
                name: name.trim(),
                type,
                rate: rate ? parseFloat(rate) : null,
                accountId: accountId || null
            };
            
            if (sundry) {
                res = await updateBillSundry(sundry.id, input);
            } else {
                res = await createBillSundry(input);
            }
            onSuccess(res);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? `Failed to ${sundry ? "update" : "create"} bill sundry`);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border bg-background shadow-2xl dark:border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-border bg-accent/20 dark:bg-accent/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/30">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {sundry ? "Edit Bill Sundry" : "Add New Bill Sundry"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-foreground">
                    {error && (
                        <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50 animate-in shake-in">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Sundry Name</span>
                            <Input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Freight, Packing Charges, Discount"
                                className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Calculation Type</span>
                                <div className="flex p-1 bg-accent/20 dark:bg-accent/10 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setType("add")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                                            type === "add" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground"
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
                                            type === "less" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground"
                                        )}
                                    >
                                        <Minus className="h-3 w-3" />
                                        LESS
                                    </button>
                                </div>
                            </div>

                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Default Rate (%)</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
                                />
                            </label>
                        </div>

                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Ledger Account (Optional)</span>
                            <div className="relative">
                                <select
                                    value={accountId}
                                    onChange={e => setAccountId(e.target.value)}
                                    className="w-full h-11 rounded-2xl border border-border bg-accent/20 dark:bg-accent/10 px-4 text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-foreground"
                                >
                                    <option value="" className="bg-background">Select Ledger Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-background">{acc.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-6 rounded-2xl text-[11px] font-bold border border-border hover:bg-accent transition-all tracking-wider text-muted-foreground"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 px-8 rounded-2xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 tracking-wider"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "SAVING..." : sundry ? "UPDATE SUNDRY" : "SAVE SUNDRY"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
