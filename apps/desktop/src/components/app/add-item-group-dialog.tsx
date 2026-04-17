"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createItemGroup, updateItemGroup, type ItemGroupRecord } from "@/lib/api/item-groups";
import { X, Save, Layers } from "lucide-react";
import { createPortal } from "react-dom";

type AddItemGroupDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (group: any) => void;
    group?: ItemGroupRecord;
};

export default function AddItemGroupDialog({ open, onClose, onSuccess, group }: AddItemGroupDialogProps) {
    const [name, setName] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setName(group?.name ?? "");
        } else {
            document.body.style.overflow = "unset";
            setName("");
            setError(null);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open, group]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            let res;
            if (group) {
                res = await updateItemGroup(group.id, { name: name.trim() });
            } else {
                res = await createItemGroup({ name: name.trim() });
            }
            onSuccess(res);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? `Failed to ${group ? "update" : "create"} item group`);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border bg-background shadow-2xl dark:border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-border bg-accent/20 dark:bg-accent/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 dark:bg-orange-950/30">
                            <Layers className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {group ? "Edit Item Group" : "Add New Item Group"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
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
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Group Name</span>
                            <Input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Raw Materials, Finished Goods, Services"
                                className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
                            />
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-6 rounded-2xl text-[11px] font-bold border hover:bg-accent transition-all tracking-wider text-muted-foreground"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 px-8 rounded-2xl text-[11px] font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-xl shadow-orange-200 dark:shadow-none transition-all flex items-center gap-2 tracking-wider"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "SAVING..." : group ? "UPDATE GROUP" : "SAVE GROUP"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
