"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { createParty } from "@/lib/api/parties";
import { X, Save, UserPlus, Mail, Phone, MapPin, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type AddCustomerDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (party: any) => void;
};

export default function AddCustomerDialog({ open, onClose, onSuccess }: AddCustomerDialogProps) {
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        panNo: "",
    });

    const update = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Customer name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await createParty({
                name: form.name.trim(),
                type: "customer",
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
                panNo: form.panNo.trim() || undefined,
            });
            onSuccess(res);
            onClose();
            // Reset form
            setForm({
                name: "", email: "", phone: "", address: "", panNo: ""
            });
        } catch (err: any) {
            setError(err?.message ?? "Failed to create customer");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-[2.5rem] border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-8 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Customer</h3>
                            <p className="text-xs text-muted-foreground">Register a new client in your system</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6">
                        <label className="space-y-1.5 block">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">FULL NAME *</span>
                            <Input
                                autoFocus
                                value={form.name}
                                onChange={e => update("name", e.target.value)}
                                placeholder="e.g. Acme Corporation"
                                className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">PHONE NUMBER</span>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={form.phone}
                                        onChange={e => update("phone", e.target.value)}
                                        placeholder="98XXXXXXXX"
                                        className="h-12 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-900"
                                    />
                                </div>
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">EMAIL ADDRESS</span>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={e => update("email", e.target.value)}
                                        placeholder="contact@company.com"
                                        className="h-12 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-900"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">PAN / VAT NUMBER</span>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={form.panNo}
                                        onChange={e => update("panNo", e.target.value)}
                                        placeholder="9-digit PAN/VAT"
                                        className="h-12 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-900"
                                    />
                                </div>
                            </label>
                            <label className="space-y-1.5 block">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">ADDRESS</span>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={form.address}
                                        onChange={e => update("address", e.target.value)}
                                        placeholder="City, Area, Building"
                                        className="h-12 rounded-2xl pl-11 bg-slate-50 dark:bg-slate-900"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 px-8 rounded-2xl text-sm font-bold border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-mono"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-12 px-8 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 font-mono"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    SAVING...
                                </div>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    SAVE CUSTOMER
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
