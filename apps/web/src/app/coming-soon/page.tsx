"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function ComingSoonPage() {
    const searchParams = useSearchParams();
    const feature = searchParams.get("feature") ?? "This feature";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,250,247,0.96),rgba(244,242,236,0.96))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-amber-200/40 blur-[120px] dark:bg-amber-500/20" />
                <div className="absolute top-1/2 -right-16 h-96 w-96 rounded-full bg-emerald-200/40 blur-[140px] dark:bg-emerald-500/20" />
                <div className="absolute bottom-[-140px] left-12 h-96 w-96 rounded-full bg-sky-200/40 blur-[140px] dark:bg-sky-500/20" />
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(60,60,60,0.2)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.08]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-panel w-full max-w-xl rounded-3xl p-8 text-center sm:p-10"
            >
                <h1 className="text-3xl sm:text-4xl font-semibold">{feature} is coming soon</h1>
                <p className="mt-3 text-muted-foreground">
                    We are polishing the experience. This section will be available in the next iteration.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/dashboard"
                        className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
                    >
                        Back to dashboard
                    </Link>
                    <Link
                        href="/"
                        className="rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5"
                    >
                        Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
