"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Filter, Plus, Search, Settings } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

const accounts = [
    { code: "1010", name: "Cash in Hand", type: "Asset" },
    { code: "1020", name: "Bank", type: "Asset" },
    { code: "2000", name: "Accounts Payable", type: "Liability" },
    { code: "4000", name: "Sales", type: "Income" },
    { code: "5000", name: "Cost of Goods Sold", type: "Expense" },
];

export default function ChartOfAccountsPage() {
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
                            Chart of Accounts
                        </span>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-semibold">Structure your ledger</h1>
                            <p className="mt-2 text-muted-foreground">
                                Organize accounts by type and keep posting rules consistent.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/coming-soon?feature=COA%20filters"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Link>
                        <Link
                            href="/coming-soon?feature=COA%20creation"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
                        >
                            <Plus className="h-4 w-4" />
                            New account
                        </Link>
                    </div>
                </motion.header>

                <motion.section variants={item} className="mt-8 glass-panel rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search accounts"
                                className="w-full rounded-full border border-white/30 bg-white/60 py-3 pl-12 pr-4 text-sm text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                            />
                        </div>
                        <Link
                            href="/coming-soon?feature=COA%20export"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <Settings className="h-4 w-4" />
                            Export
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {accounts.map((account) => (
                            <div
                                key={account.code}
                                className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/40 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-foreground font-semibold">{account.name}</p>
                                    <p className="text-xs text-muted-foreground">{account.code}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
                                        {account.type}
                                    </span>
                                    <Link
                                        href="/coming-soon?feature=Account%20details"
                                        className="text-xs font-semibold text-amber-600 hover:text-amber-500"
                                    >
                                        View details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
