"use client";

import Link from "next/link";
import { useState } from "react";
import Sidebar from "./sidebar";

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-full border border-white/30 bg-white/40 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            Menu
          </button>
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
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[80vw] border-r border-white/10 bg-background/95 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Navigation</span>
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/40 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                Close
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
