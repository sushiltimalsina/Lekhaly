"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, TrendingUp, Layers, Check } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function Home() {
    return (
        <main className="min-h-screen overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,250,247,0.96),rgba(244,242,236,0.96))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-amber-200/40 blur-[120px] dark:bg-amber-500/20" />
                <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-[140px] dark:bg-emerald-500/20" />
                <div className="absolute bottom-[-140px] left-10 h-96 w-96 rounded-full bg-sky-200/40 blur-[140px] dark:bg-sky-500/20" />
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(60,60,60,0.2)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
            </div>

            {/* Hero */}
            <section className="relative px-4 pt-24 sm:pt-28 lg:pt-32">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="mx-auto flex max-w-6xl flex-col gap-12"
                >
                    <motion.header variants={item} className="flex flex-col items-center gap-6 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 dark:border-white/10 dark:bg-white/5">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            Premium Accounting Suite
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
                            Build a calm, high-trust workspace
                            <span className="block text-gradient">for serious finance teams.</span>
                        </h1>
                        <p className="max-w-2xl text-base sm:text-lg text-muted-foreground">
                            Lekhaly delivers a premium, end-to-end accounting experience with smart workflows,
                            enterprise-grade security, and delightful interfaces across devices.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/register"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-amber-950 font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition"
                            >
                                Create account
                            </Link>
                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-full border border-white/40 bg-white/50 text-foreground font-semibold hover:bg-white/70 transition dark:border-white/10 dark:bg-white/5"
                            >
                                Sign in
                            </Link>
                        </div>
                    </motion.header>

                    <motion.div
                        variants={item}
                        className="grid gap-6 rounded-3xl border border-white/30 bg-white/40 p-8 text-left shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-3"
                    >
                        {[
                            { label: "Setup time", value: "< 15 mins", note: "Guided onboarding" },
                            { label: "Monthly close", value: "3x faster", note: "Automated workflows" },
                            { label: "Audit trails", value: "Always on", note: "Policy ready" },
                        ].map((stat) => (
                            <div key={stat.label} className="space-y-2">
                                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-semibold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.note}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="mx-auto mt-20 max-w-6xl px-4 pb-10 sm:mt-24">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid gap-6 lg:grid-cols-[1.1fr_1fr]"
                >
                    <motion.div variants={item} className="glass-panel rounded-3xl p-8 sm:p-10">
                        <h2 className="text-2xl sm:text-3xl font-semibold">One home for every workflow</h2>
                        <p className="mt-3 text-muted-foreground">
                            From chart of accounts to approvals, keep finance, ops, and leadership aligned in one
                            premium workspace.
                        </p>
                        <div className="mt-8 space-y-4">
                            {[
                                "Guided month-end close checklists",
                                "Granular roles, permissions, and approvals",
                                "Automated tax and compliance tracking",
                                "Instant reports for leadership reviews",
                            ].map((line) => (
                                <div key={line} className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                                    <span>{line}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="grid gap-6">
                        {[
                            {
                                title: "Compliance ready",
                                description: "Evidence trails, approvals, and smart checks built into each action.",
                                icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
                            },
                            {
                                title: "Live insights",
                                description: "Real-time dashboards across revenue, expenses, and cashflow.",
                                icon: <TrendingUp className="h-6 w-6 text-amber-500" />,
                            },
                            {
                                title: "Premium workflows",
                                description: "High-touch UI patterns that keep complex tasks calm and intuitive.",
                                icon: <Layers className="h-6 w-6 text-sky-500" />,
                            },
                        ].map((card) => (
                            <motion.div
                                key={card.title}
                                variants={item}
                                className="glass-panel rounded-2xl p-6"
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/5">
                                    {card.icon}
                                </div>
                                <h3 className="text-lg font-semibold">{card.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Showcase */}
            <section className="mx-auto mt-16 max-w-6xl px-4 pb-24">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid gap-6 lg:grid-cols-[1fr_1fr]"
                >
                    <motion.div variants={item} className="glass-panel rounded-3xl p-8">
                        <h3 className="text-xl font-semibold">A dashboard that feels effortless</h3>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Everything you need is curated into a single view. No clutter, no noise, just clarity.
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {[
                                { label: "Revenue", value: "??0.00" },
                                { label: "Open invoices", value: "0" },
                                { label: "Cash on hand", value: "??0.00" },
                                { label: "Reports ready", value: "12" },
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/40 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="text-muted-foreground">{metric.label}</p>
                                    <p className="mt-2 text-xl font-semibold">{metric.value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="glass-panel rounded-3xl p-8">
                        <h3 className="text-xl font-semibold">Trusted by growing teams</h3>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Built for teams that care about precision, polish, and performance.
                        </p>
                        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                            {[
                                "Fewer manual touches across approvals and vouchers.",
                                "Consistent reporting without spreadsheets.",
                                "Secure access policies from day one.",
                            ].map((note) => (
                                <div key={note} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                                    <span>{note}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/20 bg-white/40 p-5 text-sm italic text-muted-foreground dark:border-white/10 dark:bg-white/5">
                            “Lekhaly made month-end close feel elegant. The interface is calm, the data is instant,
                            and our finance team finally has breathing room.”
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-6xl px-4 pb-20">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="glass-panel rounded-3xl p-10 text-center"
                >
                    <motion.div variants={item} className="mx-auto max-w-2xl space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-semibold">Ready for premium finance operations?</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Launch your workspace today and keep every ledger, report, and approval in sync.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-8 py-4 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition"
                        >
                            Start free <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            <footer className="border-t border-white/10 py-10 text-center text-sm text-muted-foreground">
                <p>Ac 2026 Lekhaly. All rights reserved.</p>
            </footer>
        </main>
    );
}
