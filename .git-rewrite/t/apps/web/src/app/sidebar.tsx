"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-[280px] border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="px-5 py-4">
          <div className="surface soft-border rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Lekhaly</div>
                <div className="text-xs text-muted-foreground">Accounting</div>
              </div>
              <div className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                BS
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>

          <div className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-9 w-9 place-items-center rounded-xl border bg-background transition",
                      active ? "border-primary/20" : "border-border/60 group-hover:border-border",
                    ].join(" ")}
                  >
                    <Icon className={active ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                  </span>
                  <span className="truncate">{item.label}</span>

                  {active ? (
                    <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4">
          <div className="surface soft-border rounded-2xl p-3">
            <div className="text-xs text-muted-foreground">Quick tip</div>
            <div className="mt-1 text-sm">
              Show both BS and AD. Set the primary format in Settings.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

