"use client";

import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";
import QuickActionsRail from "@/components/app/quick-actions";
import CommandPalette from "@/components/app/command-palette";
import OfflineSyncBanner from "@/components/app/offline-sync-banner";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreationPage = false;

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
