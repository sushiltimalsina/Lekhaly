"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { createParty } from "@/lib/api/parties";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserPlus, Mail, Phone, MapPin, Hash, Banknote } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewCustomerPage() {
    const router = useRouter();
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        panNo: "",
        openingBalance: "",
        balanceType: "dr" as "dr" | "cr",
    });

    const update = (key: keyof typeof form, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Customer name is required.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await createParty({
                name: form.name.trim(),
                type: "customer",
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
                panNo: form.panNo.trim() || undefined,
                openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined,
                balanceType: form.balanceType,
            });
            setSuccess("Customer created successfully.");
            setTimeout(() => router.push("/customers"), 1000);
        } catch (err: any) {
            setError(err?.message ?? "Failed to create customer.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10">
            <PageHeader
                title="Add New Customer"
                description="Register a new client with their contact and billing information."
                actions={
                    <Link
                        href="/customers"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Customers
                    </Link>
                }
            />

            <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
                <div className="rounded-[2.5rem] border bg-card p-10 shadow-sm space-y-8 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                            <UserPlus className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="text-lg font-bold">Customer Profile</div>
                            <div className="text-sm text-muted-foreground">Basic information and contact details.</div>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        <label className="space-y-2 text-sm">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name *</span>
                            <Input
                                autoFocus
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="e.g. ABC Traders Pvt. Ltd."
                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-base"
                                required
                            />
                        </label>

                        <div className="grid gap-8 sm:grid-cols-2">
                            <label className="space-y-2 text-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</span>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => update("phone", e.target.value)}
                                        placeholder="98XXXXXXXX"
                                        className="h-14 rounded-2xl pl-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </label>
                            <label className="space-y-2 text-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</span>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        placeholder="contact@company.com"
                                        className="h-14 rounded-2xl pl-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2">
                            <label className="space-y-2 text-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">PAN / VAT Number</span>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        value={form.panNo}
                                        onChange={(e) => update("panNo", e.target.value)}
                                        placeholder="9-digit number"
                                        className="h-14 rounded-2xl pl-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </label>
                            <label className="space-y-2 text-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Billing Address</span>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        value={form.address}
                                        onChange={(e) => update("address", e.target.value)}
                                        placeholder="City, Street, Building"
                                        className="h-14 rounded-2xl pl-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-none">
                                <Banknote className="h-7 w-7" />
                            </div>
                            <div>
                                <div className="text-lg font-bold">Opening Balance</div>
                                <div className="text-sm text-muted-foreground">Initial receivable or payable amount.</div>
                            </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2">
                            <label className="space-y-2 text-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Opening Amount</span>
                                <Input
                                    type="number"
                                    value={form.openingBalance}
                                    onChange={(e) => update("openingBalance", e.target.value)}
                                    placeholder="0.00"
                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </label>

                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Balance Type</span>
                                <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.25rem] h-14 w-fit">
                                    {(["dr", "cr"] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => update("balanceType", t)}
                                            className={cn(
                                                "px-8 h-full rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
                                                form.balanceType === t
                                                    ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t === "dr" ? "Debit (Receivable)" : "Credit (Payable)"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t dark:border-slate-800">
                        <div className="text-sm">
                            {error ? (
                                <div className="text-red-600 font-medium animate-in fade-in slide-in-from-left-2">
                                    ⚠️ {error}
                                </div>
                            ) : success ? (
                                <div className="text-emerald-600 font-medium animate-in fade-in slide-in-from-left-2">
                                    ✅ {success}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                                href="/customers"
                                className="flex-1 sm:flex-initial h-14 px-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-mono"
                            >
                                CANCEL
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 sm:flex-initial h-14 px-10 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70 font-mono"
                            >
                                {saving ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        SAVING...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        CREATE CUSTOMER
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
