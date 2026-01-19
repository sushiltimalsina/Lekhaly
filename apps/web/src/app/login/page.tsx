"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    // Defaulting to what might be in seed for easier testing if known, else empty
    const [formData, setFormData] = useState({
        companyId: "",
        email: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:4000/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Store tokens (in real app using secure cookies or robust storage)
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            // Redirect to dashboard (to be created)
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden"
            suppressHydrationWarning
        >
            {/* Premium Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,250,249,0.9),rgba(245,244,240,0.95))] dark:bg-[linear-gradient(135deg,rgba(7,10,16,0.98),rgba(12,15,23,0.98))]" />
                <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-[90px] dark:bg-emerald-500/20" />
                <div className="absolute top-1/3 -right-10 h-80 w-80 rounded-full bg-amber-200/50 blur-[100px] dark:bg-amber-500/20" />
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
                                    A premium login experience for focused teams.
                                </h1>
                                <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                                    Secure access, refined visuals, and a seamless path to your dashboard across every device.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="font-semibold text-foreground">Encrypted Sessions</p>
                                    <p className="mt-2 text-muted-foreground">Tokens are stored securely for a smooth handoff.</p>
                                </div>
                                <div className="rounded-2xl border border-white/20 bg-white/30 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="font-semibold text-foreground">Adaptive Design</p>
                                    <p className="mt-2 text-muted-foreground">Optimized spacing and scale for mobile screens.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Welcome Back</h2>
                            <p className="text-muted-foreground">
                                Sign in to continue to your dashboard
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                            {/* Company ID Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="companyId"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Company ID
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="companyId"
                                        type="text"
                                        placeholder="e.g. 123e4567-e89b..."
                                        value={formData.companyId}
                                        onChange={handleChange}
                                        autoComplete="organization"
                                        required
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-foreground ml-1"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        required
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-foreground"
                                    >
                                        Password
                                    </label>
                                    <a
                                        href="#"
                                        className="text-xs text-amber-600 hover:text-amber-500 transition-colors"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                        required
                                        className="w-full bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-amber-950 rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link
                                href="/register"
                                className="text-amber-600 font-medium hover:underline"
                            >
                                Create free account
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
