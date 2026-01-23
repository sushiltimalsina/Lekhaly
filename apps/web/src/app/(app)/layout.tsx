// apps/web/src/app/(app)/layout.tsx

import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";
import QuickActionsRail from "@/components/app/quick-actions";
import CommandPalette from "@/components/app/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-[280px] flex-shrink-0">
        <Sidebar className="fixed inset-y-0 z-20" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        <CommandPalette />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-fade-in flex gap-6">
            <div className="min-w-0 flex-1">{children}</div>
            <QuickActionsRail />
          </div>
        </main>
      </div>
    </div>
  );
}
