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
                        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
                            <Link href="/" className="text-lg font-semibold tracking-tight">
                                Lekhaly
                            </Link>
                            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/reports" className="hover:text-foreground transition-colors">
                                    Reports
                                </Link>
                                <Link href="/invoices" className="hover:text-foreground transition-colors">
                                    Invoices
                                </Link>
                                <Link href="/vouchers" className="hover:text-foreground transition-colors">
                                    Vouchers
                                </Link>
                                <Link href="/payments" className="hover:text-foreground transition-colors">
                                    Payments
                                </Link>
                                <Link href="/customers" className="hover:text-foreground transition-colors">
                                    Customers
                                </Link>
                                <Link href="/vendors" className="hover:text-foreground transition-colors">
                                    Vendors
                                </Link>
                                <Link href="/items" className="hover:text-foreground transition-colors">
                                    Items
                                </Link>
                                <Link href="/users" className="hover:text-foreground transition-colors">
                                    Users
                                </Link>
                                <Link href="/coa" className="hover:text-foreground transition-colors">
                                    CoA
                                </Link>
                                <Link href="/settings" className="hover:text-foreground transition-colors">
                                    Settings
                                </Link>
                            </nav>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="rounded-full border border-white/30 bg-white/40 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 px-4 py-2 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
                                >
                                    Create account
                                </Link>
                            </div>
                        </div>
                    </header>
                    {children}
                </div>
            </body>
        </html>
    );
}
