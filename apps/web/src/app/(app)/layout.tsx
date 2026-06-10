"use client";

import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";
import QuickActionsRail from "@/components/app/quick-actions";
import CommandPalette from "@/components/app/command-palette";
import OfflineSyncBanner from "@/components/app/offline-sync-banner";
import UnsavedChangesGuard from "@/components/app/unsaved-changes-guard";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { clearToken, getToken } from "@/lib/store/auth";

const IDLE_LOGOUT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isCreationPage = false;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: number | null = null;

    const resetIdleTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (!getToken()) return;

      timeoutId = window.setTimeout(() => {
        clearToken();
        router.replace("/login");
      }, IDLE_LOGOUT_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
    };
  }, [router]);

  useShortcuts({
    "alt+d": () => router.push("/dashboard"),
    "alt+v": () => router.push("/vouchers"),
    "alt+s": () => router.push("/configuration"),
    "alt+p": () => router.push("/parties"),
    "alt+i": () => router.push("/items"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop sidebar */}
      {!isCreationPage && (
        <div
          className="hidden md:block flex-shrink-0"
          style={{ width: "var(--sidebar-width, 84px)" }}
        >
          <Sidebar className="fixed inset-y-0 z-20" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {!isCreationPage && <Topbar />}
        <OfflineSyncBanner />
        <CommandPalette />
        <UnsavedChangesGuard />

        {/* Content Wrapper */}
        <main className={cn(
          "flex-1 scroll-smooth",
          isCreationPage ? "overflow-hidden" : "overflow-y-auto p-4 sm:p-6 lg:p-8"
        )}>
          <div className={cn(
            "mx-auto animate-fade-in flex",
            isCreationPage ? "max-w-none w-full h-full" : "max-w-7xl gap-6"
          )}>
            <div className="min-w-0 flex-1 h-full">{children}</div>
            {!isCreationPage && <QuickActionsRail />}
          </div>
        </main>
      </div>
    </div>
  );
}
