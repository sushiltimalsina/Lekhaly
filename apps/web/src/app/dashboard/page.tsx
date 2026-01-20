"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatCurrency } from "../lib/format";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Basic auth check
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        // In a real app, calls to /auth/me would happen here
        setUser({ name: "User" });
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,250,249,0.9),rgba(245,244,240,0.95))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-amber-200/40 blur-[110px] dark:bg-amber-500/20" />
                <div className="absolute top-1/2 -right-12 h-96 w-96 rounded-full bg-emerald-200/35 blur-[130px] dark:bg-emerald-500/20" />
                <div className="absolute bottom-[-140px] left-16 h-80 w-80 rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-500/20" />
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(60,60,60,0.2)_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-[0.08]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10"
            >
                <motion.header
                    variants={itemVariants}
                    className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 dark:border-white/10 dark:bg-white/5">
                            Premium Workspace
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-semibold">
                                Welcome back, {user.name}.
                            </h1>
                            <p className="mt-2 text-muted-foreground">
                                Track the pulse of your business in one refined view.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            className="px-4 py-2 rounded-xl border border-white/40 bg-white/40 text-sm font-semibold text-foreground shadow-sm hover:bg-white/60 transition"
                        >
                            Invite teammate
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem("accessToken");
                                localStorage.removeItem("refreshToken");
                                router.push("/login");
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-amber-950 text-sm font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.header>

                <motion.section
                    variants={containerVariants}
                    className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {[
                        { title: "Total Revenue", value: formatCurrency(0), note: "No entries yet" },
                        { title: "Active Users", value: "1", note: "Owner account" },
                        { title: "Open Invoices", value: "0", note: "All settled" },
                        { title: "Cash on Hand", value: formatCurrency(0), note: "Linked to Cash in Hand" }
                    ].map((card) => (
                        <motion.div
                            key={card.title}
                            variants={itemVariants}
                            className="glass-panel rounded-2xl p-6"
                        >
                            <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                            <p className="mt-3 text-3xl font-semibold text-gradient">{card.value}</p>
                            <p className="mt-3 text-xs text-muted-foreground">{card.note}</p>
                        </motion.div>
                    ))}
                </motion.section>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
                    <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Performance</h2>
                                <p className="text-sm text-muted-foreground">Monthly overview of growth</p>
                            </div>
                            <span className="rounded-full border border-white/30 bg-white/30 px-3 py-1 text-xs font-semibold text-foreground/70 dark:border-white/10 dark:bg-white/5">
                                Last 30 days
                            </span>
                        </div>
                        <div className="mt-6 h-64 rounded-2xl border border-white/20 bg-white/20 dark:border-white/10 dark:bg-white/5 flex items-center justify-center text-sm text-muted-foreground">
                            Chart placeholder (premium charts coming soon)
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                <p className="font-semibold text-foreground">Top category</p>
                                <p className="mt-2 text-muted-foreground">No sales recorded yet</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                <p className="font-semibold text-foreground">Next invoice</p>
                                <p className="mt-2 text-muted-foreground">Create your first invoice</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-6">
                        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-6">
                            <h3 className="text-lg font-semibold">Quick actions</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Jump-start your workflow</p>
                            <div className="mt-5 grid gap-3">
                                {["Create invoice", "Add customer", "Post voucher"].map((label) => (
                                    <button
                                        key={label}
                                        className="w-full rounded-xl border border-white/30 bg-white/40 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-6">
                            <h3 className="text-lg font-semibold">Recent activity</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Nothing recorded yet</p>
                            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span>Setup your chart of accounts</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Create your first customer</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Post a voucher draft</span>
                                    <span className="text-xs">Pending</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
