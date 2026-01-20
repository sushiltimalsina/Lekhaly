"use client";

import { motion } from "framer-motion";
import { Bell, Building2, CreditCard, Lock, Mail, ShieldCheck, User } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,250,247,0.96),rgba(244,242,236,0.96))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-28 left-1/4 h-80 w-80 rounded-full bg-amber-200/40 blur-[120px] dark:bg-amber-500/20" />
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
                        Account Settings
                    </span>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-semibold">Manage your workspace</h1>
                        <p className="mt-2 text-muted-foreground">
                            Customize your account, company profile, security, and billing preferences.
                        </p>
                    </div>
                </motion.header>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <motion.section variants={item} className="glass-panel rounded-3xl p-8 sm:p-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Profile</h2>
                                <p className="text-sm text-muted-foreground">Keep your identity and contact up to date.</p>
                            </div>
                            <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/5">
                                <User className="h-5 w-5 text-amber-500" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-muted-foreground">
                                Full name
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Lekhaly Admin"
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-12 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </div>
                            </label>
                            <label className="space-y-2 text-sm text-muted-foreground">
                                Work email
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-12 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Your profile is visible to your organization.
                            </div>
                            <button className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40">
                                Save profile
                            </button>
                        </div>
                    </motion.section>

                    <motion.section variants={item} className="glass-panel rounded-3xl p-8 sm:p-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Security</h2>
                                <p className="text-sm text-muted-foreground">Control access and authentication.</p>
                            </div>
                            <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/5">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {[
                                { label: "Two-factor authentication", status: "Enabled", icon: <Lock className="h-4 w-4" /> },
                                { label: "Trusted devices", status: "2 devices", icon: <ShieldCheck className="h-4 w-4" /> },
                                { label: "Login alerts", status: "On", icon: <Bell className="h-4 w-4" /> },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/40 px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="flex items-center gap-3 text-foreground">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-muted-foreground dark:bg-white/5">
                                            {row.icon}
                                        </span>
                                        {row.label}
                                    </div>
                                    <span>{row.status}</span>
                                </div>
                            ))}
                        </div>

                        <button className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                            Manage security
                        </button>
                    </motion.section>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Company</h3>
                            <Building2 className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Configure your company name, fiscal calendar, and base currency.
                        </p>
                        <button className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                            Update company
                        </button>
                    </motion.section>

                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Notifications</h3>
                            <Bell className="h-5 w-5 text-sky-500" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage alerts for approvals, reports, and team invites.
                        </p>
                        <button className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                            Configure alerts
                        </button>
                    </motion.section>

                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Billing</h3>
                            <CreditCard className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review your plan, invoices, and payment methods.
                        </p>
                        <button className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5">
                            Manage billing
                        </button>
                    </motion.section>
                </div>
            </motion.div>
        </div>
    );
}
