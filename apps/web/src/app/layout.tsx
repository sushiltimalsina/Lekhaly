import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";
import ThemeProvider from "./theme-provider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Lekhaly - Premium Web Experience",
    description: "Experience the next generation of web applications.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full" suppressHydrationWarning>
            <body className={clsx(inter.className, "h-full bg-background")} suppressHydrationWarning>
                <ThemeProvider />
                <div className="flex min-h-full flex-col">
                    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur">
                        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
                            <div className="flex items-center gap-4">
                                <Link href="/" className="text-lg font-semibold tracking-tight">
                                    Lekhaly
                                </Link>
                                <span className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground lg:inline">
                                    Professional Accounting
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/coming-soon?feature=Help"
                                    className="rounded-full border border-white/30 bg-white/40 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                                >
                                    Help
                                </Link>
                                <Link
                                    href="/settings"
                                    className="rounded-full border border-white/30 bg-white/40 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                                >
                                    Profile
                                </Link>
                                <details className="relative lg:hidden">
                                    <summary className="cursor-pointer rounded-full border border-white/30 bg-white/40 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5">
                                        Menu
                                    </summary>
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/20 bg-white/90 p-4 text-sm text-muted-foreground shadow-xl dark:border-white/10 dark:bg-black/70">
                                        <nav className="grid gap-2">
                                            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                                            <Link href="/reports" className="hover:text-foreground transition-colors">Reports</Link>
                                            <Link href="/invoices" className="hover:text-foreground transition-colors">Invoices</Link>
                                            <Link href="/vouchers" className="hover:text-foreground transition-colors">Vouchers</Link>
                                            <Link href="/payments" className="hover:text-foreground transition-colors">Payments</Link>
                                            <Link href="/customers" className="hover:text-foreground transition-colors">Customers</Link>
                                            <Link href="/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
                                            <Link href="/items" className="hover:text-foreground transition-colors">Items</Link>
                                            <Link href="/users" className="hover:text-foreground transition-colors">Users</Link>
                                            <Link href="/coa" className="hover:text-foreground transition-colors">CoA</Link>
                                            <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
                                        </nav>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </header>
                    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-10">
                        <aside className="hidden w-64 flex-shrink-0 flex-col gap-6 lg:flex">
                            <div className="rounded-2xl border border-white/20 bg-white/60 p-4 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                                Core Modules
                            </div>
                            <nav className="grid gap-2 text-sm text-muted-foreground">
                                <Link href="/dashboard" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Dashboard</Link>
                                <Link href="/reports" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Reports</Link>
                                <Link href="/invoices" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Invoices</Link>
                                <Link href="/vouchers" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Vouchers</Link>
                                <Link href="/payments" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Payments</Link>
                            </nav>
                            <div className="rounded-2xl border border-white/20 bg-white/60 p-4 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                                Business Operations
                            </div>
                            <nav className="grid gap-2 text-sm text-muted-foreground">
                                <Link href="/customers" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Customers</Link>
                                <Link href="/vendors" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Vendors</Link>
                                <Link href="/items" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Items</Link>
                                <Link href="/users" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Users</Link>
                                <Link href="/coa" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">CoA</Link>
                                <Link href="/settings" className="rounded-xl px-3 py-2 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5">Settings</Link>
                            </nav>
                        </aside>
                        <main className="min-w-0 flex-1">{children}</main>
                    </div>
                </div>
            </body>
        </html>
    );
}
