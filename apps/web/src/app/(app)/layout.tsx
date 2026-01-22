// apps/web/src/app/(app)/layout.tsx

import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
