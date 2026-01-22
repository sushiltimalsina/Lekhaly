"use client";

import * as React from "react";
import { Search, Sun, Moon, UserCircle, Building2, CalendarDays } from "lucide-react";
import { useTheme } from "next-themes";

type TopbarProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export default function Topbar({ title, subtitle, rightSlot }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left */}
        <div className="min-w-0">
          {title ? (
            <div className="truncate text-sm font-semibold">{title}</div>
          ) : (
            <div className="truncate text-sm font-semibold">Lekhaly</div>
          )}
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
          ) : (
            <div className="truncate text-xs text-muted-foreground">Enterprise accounting</div>
          )}
        </div>

        {/* Center: Search */}
        <div className="hidden w-[520px] max-w-[45vw] items-center sm:flex">
          <div className="flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search vouchers, invoices, parties (Ctrl + K)"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Fiscal year (placeholder UI, logic later) */}
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm sm:flex"
            title="Fiscal Year"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="mono-numbers">2081/82</span>
          </button>

          {/* Company (placeholder UI, logic later) */}
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm sm:flex"
            title="Company"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[140px]">Default Company</span>
          </button>

          {rightSlot}

          {/* Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl border bg-background hover:bg-muted"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* User */}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border bg-background hover:bg-muted"
            aria-label="User menu"
            title="User"
          >
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 sm:hidden">
        <div className="flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search (tap to type)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </header>
  );
}
