"use client";

import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createUnit, updateUnit, type UnitRecord } from "@/lib/api/units";
import { X, Save, Scale } from "lucide-react";
import { createPortal } from "react-dom";

type AddUnitDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (unit: any) => void;
    unit?: UnitRecord;
};

export default function AddUnitDialog({ open, onClose, onSuccess, unit }: AddUnitDialogProps) {
    const [name, setName] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setName(unit?.name ?? "");
        } else {
            document.body.style.overflow = "unset";
            setName("");
            setError(null);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open, unit]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            let res;
            if (unit) {
                res = await updateUnit(unit.id, { name: name.trim() });
            } else {
                res = await createUnit({ name: name.trim() });
            }
            onSuccess(res);
            onClose();
        } catch (err: any) {
            setError(err?.message ?? `Failed to ${unit ? "update" : "create"} unit`);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-6 py-4 border-border bg-accent/20 dark:bg-accent/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 dark:bg-orange-950/30 font-medium">
                            <Scale className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {unit ? "Edit Unit" : "Add New Unit"}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-foreground">
                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}
                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">UNIT NAME (e.g. PCS, KG, BOX)</span>
                        <Input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter unit name"
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
                            className="h-10 px-6 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-none transition-all flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "SAVING..." : unit ? "UPDATE UNIT" : "SAVE UNIT"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
