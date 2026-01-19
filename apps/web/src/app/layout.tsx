import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";

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
                <div className="flex min-h-full flex-col">
                    {children}
                </div>
            </body>
        </html>
    );
}
