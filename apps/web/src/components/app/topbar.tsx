"use client";

import * as React from "react";
import { Search, Sun, Moon, UserCircle, Menu, X, Bell } from "lucide-react";
import Sidebar from "@/components/app/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopbarProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function Topbar({ title, subtitle, rightSlot }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setThemeState] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const stored = localStorage.getItem("lekhaly-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    root.classList.toggle("dark", nextTheme === "dark");
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    localStorage.setItem("lekhaly-theme", next);
    window.dispatchEvent(new CustomEvent("lekhaly-theme-change", { detail: { theme: next } }));
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-col">
              <h1 className="text-lg font-heading font-semibold tracking-tight leading-none text-foreground">
                {title || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-1">
                {subtitle || "Manage your business finances"}
              </p>
            </div>
          </div>

          {/* Center: Search (Optional, aligned right mostly in dashboard) */}
          <div className="hidden max-w-md flex-1 sm:flex justify-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search anything... (Ctrl + K)"
                className="w-full pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-xl"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {rightSlot}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {/* Notification dot example */}
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
            </Button>

            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-background ring-2 ring-border/20" />
            </Button>
          </div>
        </div>

        {/* Mobile Search - Only visible on small screens */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-full pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] animate-slide-in bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="font-heading font-bold text-lg">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} className="border-none w-full" />
          </div>
        </div>
      )}
    </>
  );
}
