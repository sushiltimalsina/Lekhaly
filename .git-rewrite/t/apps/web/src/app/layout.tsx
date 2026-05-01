// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { DateFormatProvider } from "@/lib/date-format";
import { fontSans, fontHeading } from "@/lib/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Lekhaly",
  description: "Enterprise accounting software for Nepal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background text-foreground antialiased ${fontSans.variable} ${fontHeading.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DateFormatProvider>
            <div suppressHydrationWarning>{children}</div>
          </DateFormatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
