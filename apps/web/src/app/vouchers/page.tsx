"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, FileText, Filter, Plus, RefreshCw } from "lucide-react";
import { formatCurrency } from "../lib/format";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

const vouchers = [
    { id: "VCH-1001", type: "Sales Invoice", status: "Draft", amount: 0, date: "2026-01-10" },
    { id: "VCH-1002", type: "Receipt", status: "Posted", amount: 0, date: "2026-01-12" },
    { id: "VCH-1003", type: "Journal", status: "Draft", amount: 0, date: "2026-01-14" },
];

export default function VouchersPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,250,247,0.96),rgba(244,242,236,0.96))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-amber-200/40 blur-[120px] dark:bg-amber-500/20" />
                <div className="absolute top-1/2 -right-16 h-96 w-96 rounded-full bg-emerald-200/40 blur-[140px] dark:bg-emerald-500/20" />
                <div className="absolute bottom-[-140px] left-12 h-96 w-96 rounded-full bg-sky-200/40 blur-[140px] dark:bg-sky-500/20" />
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(60,60,60,0.2)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10"
            >
                <motion.header variants={item} className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4">
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 dark:border-white/10 dark:bg-white/5">
                            Vouchers
                        </span>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-semibold">Track and post vouchers</h1>
                            <p className="mt-2 text-muted-foreground">
                                Prepare, preview, and post vouchers with full audit readiness.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/coming-soon?feature=Voucher%20filters"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Link>
                        <Link
                            href="/coming-soon?feature=Voucher%20creation"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
                        >
                            <Plus className="h-4 w-4" />
                            New voucher
                        </Link>
                    </div>
                </motion.header>

                <motion.section variants={item} className="mt-8 glass-panel rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-3">
                            <button className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                                <Calendar className="h-4 w-4" />
                                This month
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                                <RefreshCw className="h-4 w-4" />
                                Sync
                            </button>
                        </div>
                        <Link
                            href="/coming-soon?feature=Voucher%20export"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <FileText className="h-4 w-4" />
                            Export
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {vouchers.map((voucher) => (
                            <div
                                key={voucher.id}
                                className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/40 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-foreground font-semibold">{voucher.id}</p>
                                    <p className="text-xs text-muted-foreground">{voucher.type}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
                                        {voucher.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{voucher.date}</span>
                                    <span className="text-foreground font-semibold">{formatCurrency(voucher.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
