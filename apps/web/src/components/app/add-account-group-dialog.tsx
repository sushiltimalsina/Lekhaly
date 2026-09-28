"use client";

import * as React from "react";
import { Button, Input } from "@lekhaly/ui";
import { apiRequest } from "@/lib/api/client";
import { getAccountTypes, type AccountRecord, type AccountType, type AccountTypeOption, FALLBACK_ACCOUNT_TYPE_OPTIONS } from "@/lib/api/accounts";
import { X, Save, ChevronDown, FolderPlus, BookPlus, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import SearchableSelect from "@/components/app/searchable-select";

type AccountGroupInput = {
    code: string;
    name: string;
    type: AccountType;
    parentId?: string | null;
    isPostable: boolean;
    isContra: boolean;
};

type ParentGroupOption = { id: string; name: string; code: string; type: AccountType; parentId?: string | null };

function getGroupPath(options: ParentGroupOption[], type: AccountType, parentId?: string | null) {
    const path: string[] = [];
    let current = options.find(option => option.id === parentId && option.type === type);
    while (current?.parentId) {
        path.unshift(current.id);
        current = options.find(option => option.id === current?.parentId && option.type === type);
    }
    return path;
}

type AddAccountGroupDialogProps = {
    open: boolean;
    mode: "group" | "account";
    onClose: () => void;
    onSuccess: (account: any) => void | Promise<void>;
    parentOptions?: ParentGroupOption[];
    requireParent?: boolean;
    initialType?: AccountGroupInput["type"];
    initialParentId?: string;
    showPostCreateActions?: boolean;
    editingAccount?: AccountRecord;
};

export default function AddAccountGroupDialog({ open, mode, onClose, onSuccess, parentOptions = [], requireParent = false, initialType = "asset", initialParentId, showPostCreateActions = true, editingAccount }: AddAccountGroupDialogProps) {
    const isGroup = mode === "group";
    const isEditing = Boolean(editingAccount);
    const DialogIcon = isGroup ? FolderPlus : BookPlus;
    const [typeOptions, setTypeOptions] = React.useState<AccountTypeOption[]>(FALLBACK_ACCOUNT_TYPE_OPTIONS);
    const findRootParent = (type: AccountGroupInput["type"]) => parentOptions.find(option => option.type === type && option.parentId == null)?.id ?? null;
    const [form, setForm] = React.useState<AccountGroupInput>({
        code: "",
        name: "",
        type: initialType,
        parentId: isGroup ? findRootParent(initialType) : initialParentId ?? null,
        isPostable: false, // Groups are generally not postable
        isContra: false,
    });
    const [subgroupPath, setSubgroupPath] = React.useState<string[]>([]);
    const [ledgerGroupPath, setLedgerGroupPath] = React.useState<string[]>([]);
    const matchingRoot = parentOptions.find(option => option.type === form.type && option.parentId == null);
    const selectedParentGroup = parentOptions.find(option => option.id === form.parentId);
    const subgroupSelectors: { label: string; options: ParentGroupOption[]; valueId: string }[] = [];
    if (isGroup && !isEditing && matchingRoot) {
        let parentId = matchingRoot.id;
        for (let depth = 0; depth <= parentOptions.length; depth += 1) {
            const options = parentOptions.filter(option => option.type === form.type && option.parentId === parentId);
            if (!options.length) break;
            const valueId = subgroupPath[depth] ?? "";
            subgroupSelectors.push({
                label: depth === 0 ? "Parent Group" : `Subgroup under ${parentOptions.find(option => option.id === parentId)?.name ?? "selected group"}`,
                options,
                valueId,
            });
            if (!valueId) break;
            parentId = valueId;
        }
    }
    const ledgerGroupSelectors: { label: string; options: ParentGroupOption[]; valueId: string }[] = [];
    if (!isGroup && matchingRoot) {
        let parentId = matchingRoot.id;
        for (let depth = 0; depth <= parentOptions.length; depth += 1) {
            const options = parentOptions.filter(option => option.type === form.type && option.parentId === parentId);
            if (!options.length) break;
            const valueId = ledgerGroupPath[depth] ?? "";
            ledgerGroupSelectors.push({
                label: depth === 0 ? "Account Group" : `Subgroup under ${parentOptions.find(option => option.id === parentId)?.name ?? "selected group"}`,
                options,
                valueId,
            });
            if (!valueId) break;
            parentId = valueId;
        }
    }
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [createGroupOpen, setCreateGroupOpen] = React.useState(false);
    const [createdGroup, setCreatedGroup] = React.useState<any>(null);
    const [createLedgerOpen, setCreateLedgerOpen] = React.useState(false);
    React.useEffect(() => {
        let mounted = true;
        getAccountTypes()
            .then((options) => {
                if (!mounted) return;
                if (Array.isArray(options) && options.length > 0) setTypeOptions(options);
            })
            .catch(() => undefined);

        if (!open) return () => {
            mounted = false;
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        setForm(editingAccount ? {
            code: editingAccount.code,
            name: editingAccount.name,
            type: editingAccount.type,
            parentId: editingAccount.parentId ?? null,
            isPostable: Boolean(editingAccount.isPostable),
            isContra: Boolean(editingAccount.isContra),
        } : {
            code: "",
            name: "",
            type: initialType,
            parentId: isGroup ? findRootParent(initialType) : initialParentId ?? null,
            isPostable: mode === "account",
            isContra: false,
        });
        setSubgroupPath(isGroup && editingAccount ? getGroupPath(parentOptions, editingAccount.type, editingAccount.parentId) : []);
        setLedgerGroupPath(!isGroup ? getGroupPath(parentOptions, editingAccount?.type ?? initialType, editingAccount?.parentId ?? initialParentId) : []);
        setError(null);
        setCreatedGroup(null);
        setCreateLedgerOpen(false);
        return () => {
            mounted = false;
            document.body.style.overflow = previousOverflow;
        };
    }, [open, mode, initialType, initialParentId, isGroup, editingAccount?.id]);

    const typeChoices = typeOptions.length ? typeOptions : FALLBACK_ACCOUNT_TYPE_OPTIONS;
    const typeLabel = (value: AccountType) => typeChoices.find(option => option.value === value)?.label ?? value;

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Account name is required");
            return;
        }
        if (isGroup && requireParent && !form.parentId) {
            setError(`No ${form.type} root type is available for this group.`);
            return;
        }
        if (!isGroup && !form.parentId && !isEditing) {
            setError("Choose an account group");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await apiRequest<any>({
                method: isEditing ? "PUT" : "POST",
                path: isEditing ? `/accounts/${encodeURIComponent(editingAccount!.id)}` : "/accounts",
                body: {
                    ...form,
                    isGroup,
                    isPostable: !isGroup,
                    name: form.name.trim(),
                    code: form.code.trim() || undefined,
                },
            });
            await onSuccess(res);
            if (isGroup && showPostCreateActions && !isEditing) {
                setCreatedGroup(res);
                return;
            }
            onClose();
            setForm({
                code: "",
                name: "",
                type: "asset",
                parentId: null,
                isPostable: false,
                isContra: false,
            });
        } catch (err: any) {
            setError(err?.message ?? `Failed to create ${mode}`);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-[2.5rem] border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={cn(
                    "flex items-center justify-between border-b px-8 py-6 dark:border-slate-800",
                    isGroup ? "bg-indigo-50/70 dark:bg-indigo-950/20" : "bg-emerald-50/70 dark:bg-emerald-950/20"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                            isGroup ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30"
                        )}>
                            <DialogIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-foreground leading-none">{isEditing ? `Edit ${isGroup ? "Account Group" : "Ledger Account"}` : isGroup ? "Add Account Group" : "Add Ledger Account"}</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-1">{isGroup ? "Create a heading to organize related accounts." : "Create an account that can receive transactions."}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {createdGroup ? (
                    <div className="space-y-6 p-8">
                        <div>
                            <h4 className="text-lg font-bold text-foreground">Group created</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{createdGroup.code} · {createdGroup.name} is ready for ledger accounts.</p>
                        </div>
                        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                            <Button type="button" variant="outline" onClick={onClose}>Done</Button>
                            <Button type="button" onClick={() => setCreateLedgerOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
                                <BookPlus className="mr-2 h-4 w-4" />
                                Add ledger here
                            </Button>
                        </div>
                    </div>
                ) : <form onSubmit={handleSubmit} className="max-h-[calc(100vh-9rem)] overflow-y-auto p-8 space-y-6">
                    {error && (
                        <div className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    {isGroup ? (
                        <>
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Financial Type</span>
                                <div className="relative">
                                    <select autoFocus disabled={requireParent || isEditing} value={form.type} onChange={e => {
                                        const type = e.target.value as AccountGroupInput["type"];
                                        setForm({ ...form, type, parentId: findRootParent(type) });
                                        setSubgroupPath([]);
                                    }} className="h-12 w-full appearance-none rounded-2xl bg-slate-50 border-none dark:bg-slate-900 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer">
                                        {typeChoices.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </label>
                            <span className="ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">Parent Group</span>
                            {subgroupSelectors.map((selector, depth) => (
                                <div key={`${selector.label}-${depth}`} className="space-y-1.5">
                                    <span className="ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{selector.label}</span>
                                    <SearchableSelect
                                        options={selector.options}
                                        valueId={selector.valueId}
                                        onChange={id => {
                                            setSubgroupPath(current => [...current.slice(0, depth), id]);
                                            setForm(current => ({ ...current, parentId: id }));
                                        }}
                                        getLabel={group => `${group.code} · ${group.name}`}
                                        menuZIndex={10020}
                                        placeholder={`Search ${selector.label.toLowerCase()}...`}
                                        emptyText="No child groups found"
                                        buttonClassName="h-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-900 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                                    />
                                </div>
                            ))}
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Group Code (Optional)</span>
                                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Generated automatically when blank" className="h-12 rounded-2xl bg-slate-50 border-none dark:bg-slate-900 focus-visible:ring-indigo-500/20" />
                            </label>
                        </>
                    ) : (
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Financial Type</span>
                            <div className="relative">
                                <select
                                    autoFocus
                                    value={form.type}
                                    onChange={e => {
                                        const type = e.target.value as AccountGroupInput["type"];
                                        setForm({ ...form, type, parentId: null, isContra: type === "income" || type === "expense" ? form.isContra : false });
                                        setLedgerGroupPath([]);
                                    }}
                                    disabled={Boolean(initialParentId)}
                                    className="h-12 w-full appearance-none rounded-2xl bg-slate-50 border-none dark:bg-slate-900 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                >
                                    {typeChoices.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                        </label>
                    )}

                    {!isGroup && (form.type === "income" || form.type === "expense") && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={form.isContra}
                                onChange={e => setForm(current => ({ ...current, isContra: e.target.checked }))}
                                className="mt-0.5 h-4 w-4 accent-emerald-600"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-foreground">Contra account</span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {form.type === "income" ? "Contra-Income: reduces income." : "Contra-Expense: reduces expenses."}
                                </span>
                            </span>
                        </label>
                    )}

                    {!isGroup && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Account Group (Required)</span>
                                <button type="button" onClick={() => setCreateGroupOpen(true)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700">
                                    <Plus className="h-3.5 w-3.5" />
                                    Add new
                                </button>
                            </div>
                            {ledgerGroupSelectors.map((selector, depth) => (
                                <div key={`${selector.label}-${depth}`} className="space-y-1.5">
                                    <span className="ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">{selector.label}</span>
                                    <SearchableSelect
                                        options={selector.options}
                                        valueId={selector.valueId}
                                        onChange={id => {
                                            setLedgerGroupPath(current => [...current.slice(0, depth), id]);
                                            setForm(current => ({ ...current, parentId: id || null }));
                                        }}
                                        getLabel={group => `${group.code} · ${group.name}`}
                                        menuZIndex={10020}
                                        placeholder={`Search ${form.type} groups...`}
                                        emptyText={`No ${form.type} groups found`}
                                        buttonClassName="h-12 rounded-2xl border-none bg-slate-50 dark:bg-slate-900 shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {!isGroup && (
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Account Code (Optional)</span>
                            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Generated automatically when blank" className="h-12 rounded-2xl bg-slate-50 border-none dark:bg-slate-900 focus-visible:ring-emerald-500/20" />
                        </label>
                    )}

                    <label className="space-y-1.5 block">
                        <span className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">{isGroup ? "Group Name" : "Account Name"}</span>
                        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={isGroup ? "e.g. Current Assets" : "e.g. Cash in Hand"} className={cn("h-12 rounded-2xl bg-slate-50 border-none dark:bg-slate-900", isGroup ? "focus-visible:ring-indigo-500/20" : "focus-visible:ring-emerald-500/20")} />
                    </label>

                    {isGroup ? (
                        <p className="text-xs text-muted-foreground">
                            {selectedParentGroup ? selectedParentGroup.id === matchingRoot?.id ? `No subgroup selected. This group will be placed under the ${typeLabel(form.type)} root.` : `This group will be placed under ${selectedParentGroup.name}.` : requireParent ? `No ${form.type} root type is available for this subgroup.` : `No ${form.type} root group exists yet. This group will be created at the top level.`}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Choose a group of the selected financial type. Leave it empty to create a top-level account.</p>
                    )}

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
                            disabled={saving || (isGroup && requireParent && !form.parentId)}
                            className={cn(
                                "h-12 px-10 rounded-2xl text-xs font-black text-white transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] whitespace-nowrap",
                                isGroup ? "bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-600/20"
                            )}
                        >
                            <Save className="h-4 w-4 shrink-0" />
                            {saving ? "Saving..." : isEditing ? "Save Changes" : isGroup ? "Create Group" : "Create Ledger Account"}
                        </button>
                    </div>
                </form>}
            </div>
            {mode === "account" && (
                <AddAccountGroupDialog
                    open={createGroupOpen}
                    mode="group"
                    requireParent={Boolean(matchingRoot)}
                    initialType={form.type}
                    showPostCreateActions={false}
                    parentOptions={parentOptions}
                    onClose={() => setCreateGroupOpen(false)}
                    onSuccess={async group => {
                        setLedgerGroupPath(getGroupPath([...parentOptions, group], group.type, group.id));
                        setForm(current => ({ ...current, type: group.type, parentId: group.id }));
                        setCreateGroupOpen(false);
                        await onSuccess(group);
                    }}
                />
            )}
            {isGroup && createdGroup && (
                <AddAccountGroupDialog
                    open={createLedgerOpen}
                    mode="account"
                    initialType={createdGroup.type}
                    initialParentId={createdGroup.id}
                    parentOptions={[...parentOptions, createdGroup]}
                    onClose={() => setCreateLedgerOpen(false)}
                    onSuccess={async account => {
                        await onSuccess(account);
                        setCreateLedgerOpen(false);
                        onClose();
                    }}
                />
            )}
        </div>,
        document.body
    );
}
