"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Filter, Mail, Phone, Plus, Search, Store } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

const vendors = [
    { name: "Everest Logistics", email: "ops@everestlogistics.com", phone: "+977-1-5523456", status: "Active" },
    { name: "Valley Office Supplies", email: "sales@valleyoffice.com", phone: "+977-1-5531122", status: "Active" },
    { name: "Hetauda Packaging", email: "contact@hetaudapack.com", phone: "+977-57-523100", status: "On hold" },
];

export default function VendorsPage() {
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
                            Vendors
                        </span>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-semibold">Manage vendors & suppliers</h1>
                            <p className="mt-2 text-muted-foreground">
                                Keep procurement contacts, invoices, and payment details in one place.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/coming-soon?feature=Vendor%20filters"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Link>
                        <Link
                            href="/coming-soon?feature=Vendor%20creation"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
                        >
                            <Plus className="h-4 w-4" />
                            New vendor
                        </Link>
                    </div>
                </motion.header>

                <motion.section variants={item} className="mt-8 glass-panel rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search vendors"
                                className="w-full rounded-full border border-white/30 bg-white/60 py-3 pl-12 pr-4 text-sm text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                            />
                        </div>
                        <Link
                            href="/coming-soon?feature=Vendor%20export"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                        >
                            <Store className="h-4 w-4" />
                            Export
                        </Link>
                    </div>

                    <div className="mt-6 space-y-4">
                        {vendors.map((vendor) => (
                            <div
                                key={vendor.name}
                                className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/40 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-foreground font-semibold">{vendor.name}</p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> {vendor.email}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> {vendor.phone}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="rounded-full border border-white/30 bg-white/60 px-3 py-1 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-white/5">
                                        {vendor.status}
                                    </span>
                                    <Link
                                        href="/coming-soon?feature=Vendor%20details"
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
