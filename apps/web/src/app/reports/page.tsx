"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, PieChart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "../lib/format";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function ReportsPage() {
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
                <motion.header variants={item} className="space-y-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 dark:border-white/10 dark:bg-white/5">
                        Reports
                    </span>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-semibold">Insightful, audit-ready reporting</h1>
                        <p className="mt-2 text-muted-foreground">
                            Review performance, compliance, and cashflow with executive-grade reporting.
                        </p>
                    </div>
                </motion.header>

                <motion.section
                    variants={container}
                    className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {[
                        { title: "Profit & Loss", value: formatCurrency(0), icon: <TrendingUp className="h-5 w-5" /> },
                        { title: "Balance Sheet", value: formatCurrency(0), icon: <BarChart3 className="h-5 w-5" /> },
                        { title: "Cashflow", value: formatCurrency(0), icon: <PieChart className="h-5 w-5" /> },
                        { title: "VAT Summary", value: "0 filings", icon: <FileText className="h-5 w-5" /> },
                    ].map((card) => (
                        <motion.div
                            key={card.title}
                            variants={item}
                            className="glass-panel rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{card.title}</span>
                                <span className="rounded-xl bg-white/60 p-2 text-foreground dark:bg-white/5">
                                    {card.icon}
                                </span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold">{card.value}</p>
                            <p className="mt-2 text-xs text-muted-foreground">No data yet</p>
                        </motion.div>
                    ))}
                </motion.section>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Monthly performance</h2>
                                <p className="text-sm text-muted-foreground">Revenue vs expenses</p>
                            </div>
                            <span className="rounded-full border border-white/30 bg-white/30 px-3 py-1 text-xs font-semibold text-foreground/70 dark:border-white/10 dark:bg-white/5">
                                Last 12 months
                            </span>
                        </div>
                        <div className="mt-6 h-64 rounded-2xl border border-white/20 bg-white/20 dark:border-white/10 dark:bg-white/5 flex items-center justify-center text-sm text-muted-foreground">
                            Chart placeholder (Premium charts coming soon)
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                <p className="font-semibold text-foreground">Gross margin</p>
                                <p className="mt-2 text-muted-foreground">No entries yet</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                <p className="font-semibold text-foreground">Operating expenses</p>
                                <p className="mt-2 text-muted-foreground">No entries yet</p>
                            </div>
                        </div>
                    </motion.section>

                    <div className="grid gap-6">
                        <motion.section variants={item} className="glass-panel rounded-3xl p-6">
                            <h3 className="text-lg font-semibold">Saved reports</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Quick access to favorites</p>
                            <div className="mt-5 grid gap-3">
                                {["Trial balance", "Aging summary", "Tax liability"].map((label) => (
                                    <Link
                                        key={label}
                                        href={`/coming-soon?feature=${encodeURIComponent(label)}`}
                                        className="w-full rounded-xl border border-white/30 bg-white/40 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </motion.section>

                        <motion.section variants={item} className="glass-panel rounded-3xl p-6">
                            <h3 className="text-lg font-semibold">Compliance status</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Outstanding tasks</p>
                            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span>Review VAT filings</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Generate balance sheet</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Export monthly P&L</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
