// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
