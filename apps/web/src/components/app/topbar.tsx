"use client";

import * as React from "react";
import { Search, Menu, X, Bell, List, Sun, Moon, LayoutGrid, User, LogOut } from "lucide-react";
import Sidebar from "@/components/app/sidebar";
import { Input } from "@lekhaly/ui";
import { getUiState, subscribeUi, toggleDensity } from "@/lib/store/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@lekhaly/ui";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/store/auth";

type TopbarProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function Topbar({ title, subtitle, rightSlot }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [density, setDensityState] = React.useState(getUiState().density);
  const [theme, setThemeState] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  React.useEffect(() => {
    return subscribeUi((next) => {
      setDensityState(next.density);
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);
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
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 shadow-sm shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 px-6 py-3">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

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

            {mounted ? (
              <button
                type="button"
                className="hidden sm:flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={toggleDensity}
              >
                {density === "compact" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
                {density === "compact" ? "Compact" : "Comfortable"}
              </button>
            ) : (
              <div className="hidden sm:block h-7 w-[110px]" aria-hidden="true" />
            )}

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {/* Notification dot example */}
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border-2 border-background ring-2 ring-border/20 hover:scale-105 transition-transform" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl glass-panel border-border/50">
                <DropdownMenuLabel className="font-normal p-2 text-foreground">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">Sushil Timalsina</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest leading-none text-muted-foreground mt-1">sushil@lekhaly.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-primary/10 cursor-pointer transition-colors">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium text-sm text-foreground">Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/30 cursor-pointer transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium text-sm">Log out & Exit</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} className="border-none w-full" />
          </div>
        </div>
      )}
    </>
  );
}
