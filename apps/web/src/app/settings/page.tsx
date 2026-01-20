"use client";

import { motion } from "framer-motion";
import { Bell, Building2, CreditCard, Lock, Mail, Moon, ShieldCheck, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
    const router = useRouter();
    const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">("system");
    const [profile, setProfile] = useState({ name: "", email: "" });
    const [company, setCompany] = useState({
        name: "",
        baseCurrency: "NPR",
        timezone: "Asia/Kathmandu",
        fiscalYearStartMonth: 4,
        invoicePrefix: "INV"
    });
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        reportAlerts: true,
        securityAlerts: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isCompanySaving, setIsCompanySaving] = useState(false);
    const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);
    const [isBilling, setIsBilling] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("lekhaly-theme");
        if (stored === "light" || stored === "dark" || stored === "system") {
            setThemeMode(stored);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:4000/v1/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setProfile({ name: data.name ?? "", email: data.email ?? "" });
            })
            .catch(() => {
                setError("Failed to load profile.");
            });

        fetch("http://localhost:4000/v1/auth/company", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setCompany({
                        name: data.name ?? "",
                        baseCurrency: data.baseCurrency ?? "NPR",
                        timezone: data.timezone ?? "Asia/Kathmandu",
                        fiscalYearStartMonth: data.fiscalYearStartMonth ?? 4,
                        invoicePrefix: data.invoicePrefix ?? "INV"
                    });
                }
            })
            .catch(() => {
                setError("Failed to load company.");
            });

        const storedNotifications = localStorage.getItem("lekhaly-notifications");
        if (storedNotifications) {
            try {
                const parsed = JSON.parse(storedNotifications);
                setNotifications({
                    emailAlerts: Boolean(parsed.emailAlerts),
                    reportAlerts: Boolean(parsed.reportAlerts),
                    securityAlerts: Boolean(parsed.securityAlerts)
                });
            } catch {
                // Ignore parsing errors
            }
        }
    }, [router]);

    const handleThemeChange = (mode: "system" | "light" | "dark") => {
        setThemeMode(mode);
        localStorage.setItem("lekhaly-theme", mode);
        window.dispatchEvent(new CustomEvent("lekhaly-theme-change", { detail: { theme: mode } }));
    };

    const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target;
        setProfile((prev) => ({ ...prev, [id]: value }));
        setMessage("");
        setError("");
    };

    const handleProfileSave = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        setIsSaving(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("http://localhost:4000/v1/auth/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Update failed");
            setProfile({ name: data.name ?? "", email: data.email ?? "" });
            setMessage("Profile updated.");
        } catch (err: any) {
            setError(err.message || "Update failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompanyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target;
        setCompany((prev) => ({
            ...prev,
            [id]: id === "fiscalYearStartMonth" ? Number(value) : value
        }));
        setMessage("");
        setError("");
    };

    const handleCompanySave = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        setIsCompanySaving(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("http://localhost:4000/v1/auth/company", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(company)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Update failed");
            setCompany({
                name: data.name ?? "",
                baseCurrency: data.baseCurrency ?? "NPR",
                timezone: data.timezone ?? "Asia/Kathmandu",
                fiscalYearStartMonth: data.fiscalYearStartMonth ?? 4,
                invoicePrefix: data.invoicePrefix ?? "INV"
            });
            setMessage("Company updated.");
        } catch (err: any) {
            setError(err.message || "Update failed.");
        } finally {
            setIsCompanySaving(false);
        }
    };

    const handleNotificationsToggle = (key: keyof typeof notifications) => {
        setNotifications((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem("lekhaly-notifications", JSON.stringify(next));
            return next;
        });
        setMessage("");
        setError("");
    };

    const handleNotificationsSave = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        setIsNotificationsSaving(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("http://localhost:4000/v1/auth/notifications", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(notifications)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Update failed");
            setMessage("Notifications updated.");
        } catch (err: any) {
            setError(err.message || "Update failed.");
        } finally {
            setIsNotificationsSaving(false);
        }
    };

    const handleBillingPortal = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        setIsBilling(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("http://localhost:4000/v1/auth/billing/portal", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Billing portal unavailable");
            setMessage("Billing portal request submitted.");
        } catch (err: any) {
            setError(err.message || "Billing portal unavailable.");
        } finally {
            setIsBilling(false);
        }
    };

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

                        {(error || message) && (
                            <div className="mt-4 space-y-2 text-sm">
                                {error && (
                                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-500">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-500">
                                        {message}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-muted-foreground">
                                Full name
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Lekhaly Admin"
                                        id="name"
                                        value={profile.name}
                                        onChange={handleProfileChange}
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
                                        id="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-12 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Your profile is visible to your organization.
                            </div>
                            <button
                                type="button"
                                onClick={handleProfileSave}
                                disabled={isSaving}
                                className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-6 py-3 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? "Saving..." : "Save profile"}
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

                        <Link
                            href="/coming-soon?feature=Security%20settings"
                            className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5 text-center"
                        >
                            Manage security
                        </Link>
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
                        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                            <label className="space-y-2 text-sm text-muted-foreground">
                                Company name
                                <input
                                    id="name"
                                    type="text"
                                    value={company.name}
                                    onChange={handleCompanyChange}
                                    className="w-full rounded-xl border border-white/30 bg-white/60 px-4 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                />
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-2 text-sm text-muted-foreground">
                                    Base currency
                                    <input
                                        id="baseCurrency"
                                        type="text"
                                        value={company.baseCurrency}
                                        onChange={handleCompanyChange}
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-4 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-muted-foreground">
                                    Fiscal start month
                                    <input
                                        id="fiscalYearStartMonth"
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={company.fiscalYearStartMonth}
                                        onChange={handleCompanyChange}
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-4 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </label>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-2 text-sm text-muted-foreground">
                                    Timezone
                                    <input
                                        id="timezone"
                                        type="text"
                                        value={company.timezone}
                                        onChange={handleCompanyChange}
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-4 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-muted-foreground">
                                    Invoice prefix
                                    <input
                                        id="invoicePrefix"
                                        type="text"
                                        value={company.invoicePrefix}
                                        onChange={handleCompanyChange}
                                        className="w-full rounded-xl border border-white/30 bg-white/60 px-4 py-3 text-foreground outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-white/5"
                                    />
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={handleCompanySave}
                                disabled={isCompanySaving}
                                className="w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isCompanySaving ? "Saving..." : "Update company"}
                            </button>
                        </div>
                    </motion.section>

                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Notifications</h3>
                            <Bell className="h-5 w-5 text-sky-500" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage alerts for approvals, reports, and team invites.
                        </p>
                        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                            {[
                                { key: "emailAlerts", label: "Email alerts" },
                                { key: "reportAlerts", label: "Report summaries" },
                                { key: "securityAlerts", label: "Security alerts" }
                            ].map((row) => (
                                <label key={row.key} className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                    <span>{row.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={notifications[row.key as keyof typeof notifications]}
                                        onChange={() => handleNotificationsToggle(row.key as keyof typeof notifications)}
                                        className="h-4 w-4 rounded border-white/30 bg-white/60 text-amber-500 focus:ring-amber-300/40"
                                    />
                                </label>
                            ))}
                            <button
                                type="button"
                                onClick={handleNotificationsSave}
                                disabled={isNotificationsSaving}
                                className="w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isNotificationsSaving ? "Saving..." : "Configure alerts"}
                            </button>
                        </div>
                    </motion.section>

                    <motion.section variants={item} className="glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Billing</h3>
                            <CreditCard className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review your plan, invoices, and payment methods.
                        </p>
                        <button
                            type="button"
                            onClick={handleBillingPortal}
                            disabled={isBilling}
                            className="mt-6 w-full rounded-full border border-white/40 bg-white/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 dark:border-white/10 dark:bg-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isBilling ? "Opening..." : "Manage billing"}
                        </button>
                    </motion.section>
                </div>

                <motion.section variants={item} className="mt-6 glass-panel rounded-3xl p-8 sm:p-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Theme</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose how the interface appears for your workspace.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {[
                            { id: "theme-system", label: "System", icon: <ShieldCheck className="h-4 w-4" /> },
                            { id: "theme-light", label: "Light", icon: <Sun className="h-4 w-4" /> },
                            { id: "theme-dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
                        ].map((option) => (
                            <label
                                key={option.id}
                                htmlFor={option.id}
                                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-3 text-sm text-muted-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                            >
                                <input
                                    id={option.id}
                                    name="theme"
                                    type="radio"
                                    checked={themeMode === option.label.toLowerCase()}
                                    onChange={() => handleThemeChange(option.label.toLowerCase() as "system" | "light" | "dark")}
                                    className="h-4 w-4 border-white/30 text-amber-500 focus:ring-amber-300/40"
                                />
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 text-muted-foreground dark:bg-white/5">
                                    {option.icon}
                                </span>
                                <span className="text-foreground">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
