"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Building2, User } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,250,249,0.9),rgba(245,244,240,0.95))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-amber-200/40 blur-[90px] dark:bg-amber-500/20" />
                <div className="absolute top-1/3 -right-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-[100px] dark:bg-emerald-500/20" />
                <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-sky-200/40 blur-[120px] dark:bg-sky-500/20" />
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(60,60,60,0.2)_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-[0.08]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-5xl"
            >
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-10 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="glass-panel rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70 dark:border-white/10 dark:bg-white/5">
                                Private Workspace
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                                    Create a premium workspace in minutes.
                                </h1>
                                <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                                    Bring your finance workflows together with a modern, secure, and beautifully crafted experience.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="font-semibold text-foreground">Team-ready setup</p>
                                    <p className="mt-2 text-muted-foreground">Invite collaborators and manage access by role.</p>
                                </div>
                                <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="font-semibold text-foreground">Secure by design</p>
                                    <p className="mt-2 text-muted-foreground">Built-in controls for audit trails and approvals.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Create Account</h2>
                            <p className="text-muted-foreground">
                                Start with your company details and secure login.
                            </p>
                        </div>

                        <form className="space-y-5 sm:space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="companyName"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Company name
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="companyName"
                                        type="text"
                                        placeholder="Lekhaly Labs"
                                        autoComplete="organization"
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="fullName"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Full name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Lekhaly Admin"
                                        autoComplete="name"
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Work email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        autoComplete="email"
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Create a strong password"
                                        autoComplete="new-password"
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="confirmPassword"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        autoComplete="new-password"
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-3 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/60 text-amber-500 focus:ring-amber-300/40"
                                />
                                <span>
                                    I agree to the terms and acknowledge the privacy policy.
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-amber-950 rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Create account
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-amber-600 font-medium hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
