"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createItemGroup, updateItemGroup, type ItemGroupRecord } from "@/lib/api/item-groups";
import { X, Save, FolderPlus } from "lucide-react";
import { createPortal } from "react-dom";

type AddGroupDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (group: any) => void;
    group?: ItemGroupRecord;
};

export default function AddGroupDialog({ open, onClose, onSuccess, group }: AddGroupDialogProps) {
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
            setError(err?.message ?? `Failed to ${group ? "update" : "create"} group`);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4 border-border bg-accent/20 dark:bg-accent/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-950/30">
                            <FolderPlus className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {group ? "Edit Group" : "Add New Group"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-foreground">
                    {error && (
                        <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}
                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">GROUP NAME (e.g. ELECTRONICS, STATIONERY)</span>
                        <Input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter group name"
                            className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10 border-border"
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-6 rounded-xl text-xs font-bold border border-border hover:bg-accent transition-all text-muted-foreground"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-10 px-6 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2"
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
