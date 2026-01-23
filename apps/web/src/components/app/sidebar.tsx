"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building2,
  Package,
  Receipt,
  Settings,
  Wallet,
  ChevronRight,
  PieChart
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/vouchers", label: "Vouchers", icon: BookOpen },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/items", label: "Items", icon: Package },
  { href: "/coa", label: "Chart of Accounts", icon: Receipt },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate?: () => void;
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("h-screen w-[280px] border-r bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-card/20", className)}>
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="font-heading text-lg font-bold tracking-tight text-foreground">Lekhaly</div>
              <div className="text-xs font-medium text-muted-foreground">Accounting OS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Main Menu
          </div>

          {nav.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <span className="text-xs font-bold">BS</span>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">System Format</div>
                <div className="text-sm font-bold text-foreground">Nepali Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
