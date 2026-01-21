import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";
import ThemeProvider from "./theme-provider";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

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
                    <Topbar />
                    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-10">
                        <aside className="hidden w-64 flex-shrink-0 flex-col gap-6 lg:flex">
                            <Sidebar />
                        </aside>
                        <main className="min-w-0 flex-1">{children}</main>
                    </div>
                </div>
            </body>
        </html>
    );
}
