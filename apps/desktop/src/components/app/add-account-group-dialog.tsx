import * as React from "react";
import { Input } from "@lekhaly/ui";
import { apiRequest } from "@/lib/api/client";
import { X, Save, Layers, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type AccountGroupInput = {
    code: string;
    name: string;
    type: "asset" | "liability" | "equity" | "income" | "expense";
    parentId?: string | null;
    isPostable: boolean;
};

type AddAccountGroupDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (account: any) => void;
    parentOptions?: { id: string; name: string }[];
};

export default function AddAccountGroupDialog({ open, onClose, onSuccess, parentOptions = [] }: AddAccountGroupDialogProps) {
    const [form, setForm] = React.useState<AccountGroupInput>({
        code: "",
        name: "",
        type: "asset",
        parentId: null,
        isPostable: false, // Groups are generally not postable
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
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
        if (!form.name.trim() || !form.code.trim()) {
            setError("Account code and name are required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await apiRequest<any>({
                method: "POST",
                path: "/accounts",
                body: {
                    ...form,
                    name: form.name.trim(),
                    code: form.code.trim(),
                },
            });
            onSuccess(res);
            onClose();
            setForm({
                code: "",
                name: "",
                type: "asset",
                parentId: null,
                isPostable: false,
            });
        } catch (err: any) {
            setError(err?.message ?? "Failed to create account group");
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-[2.5rem] border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b px-8 py-6 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/30">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-foreground leading-none">Create Account Group</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">Chart of Accounts Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Account Code</span>
                            <Input
                                autoFocus
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="e.g. 1000"
                                className="h-12 rounded-2xl bg-slate-50 border-none dark:bg-slate-900 focus-visible:ring-indigo-500/20"
                            />
                        </label>

                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Group Category</span>
                            <div className="relative">
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                                    className="h-12 w-full appearance-none rounded-2xl bg-slate-50 border-none dark:bg-slate-900 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                >
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                        </label>
                    </div>

                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Group Name</span>
                        <Input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Current Assets, Operating Expenses"
                            className="h-12 rounded-2xl bg-slate-50 border-none dark:bg-slate-900 focus-visible:ring-indigo-500/20"
                        />
                    </label>

                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Parent Group (Optional)</span>
                        <div className="relative">
                            <select
                                value={form.parentId || ""}
                                onChange={e => setForm({ ...form, parentId: e.target.value || null })}
                                className="h-12 w-full appearance-none rounded-2xl bg-slate-50 border-none dark:bg-slate-900 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                            >
                                <option value="">Root Group (No Parent)</option>
                                {parentOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </label>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <div className="text-xs font-black text-foreground uppercase tracking-tight">Allow Postings?</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Should transactions be posted directly to this group?</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, isPostable: !form.isPostable })}
                            className={cn(
                                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                form.isPostable ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    form.isPostable ? "translate-x-5" : "translate-x-0"
                                )}
                            />
                        </button>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 px-8 rounded-2xl text-xs font-black border border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all uppercase tracking-widest text-slate-600 dark:text-slate-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-12 px-10 rounded-2xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 transition-all flex items-center gap-2 uppercase tracking-[0.2em]"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Processing..." : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
