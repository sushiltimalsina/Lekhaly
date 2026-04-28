"use client";

import * as React from "react";
import { Input, Switch } from "@lekhaly/ui";
import { createSaleType, updateSaleType } from "@/lib/api/sale-types";
import { X, Save, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

type AddSaleTypeDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (saleType: any) => void;
    initialData?: any;
};

export default function AddSaleTypeDialog({ open, onClose, onSuccess, initialData }: AddSaleTypeDialogProps) {
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [name, setName] = React.useState("");
    const [isActive, setIsActive] = React.useState(true);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setName(initialData?.name ?? "");
            setIsActive(initialData?.isActive ?? true);
            setError(null);
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Sale type name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            let res;
            if (initialData?.id) {
                res = await updateSaleType(initialData.id, {
                    name: name.trim(),
                    isActive
                });
            } else {
                res = await createSaleType({
                    name: name.trim(),
                    isActive
                });
            }
            onSuccess(res);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Failed to create sale type");
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-[2.5rem] border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b px-8 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Tag className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {initialData ? "Edit Sale Type" : "Add Sale Type"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {initialData ? "Update existing sale type details" : "Categorize your sales transactions"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">TYPE NAME *</span>
                        <Input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Standard, Wholesale, Online"
                            className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                    </label>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Active Status</div>
                            <div className="text-[10px] text-muted-foreground">Enable or disable this sale type</div>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                        <button type="button" onClick={onClose} className="h-12 px-6 rounded-2xl text-sm font-bold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all font-mono">
                            CANCEL
                        </button>
                        <button type="submit" disabled={saving} className="h-12 px-6 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2 font-mono">
                            {saving ? "SAVING..." : "SAVE TYPE"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
