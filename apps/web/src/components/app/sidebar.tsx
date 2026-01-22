"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  BookOpen,
  Users,
  Building2,
  Boxes,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Invoices", href: "/invoices", icon: <FileText className="h-4 w-4" /> },
      { label: "Payments", href: "/payments", icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    title: "Parties",
    items: [
      { label: "Customers", href: "/customers", icon: <Users className="h-4 w-4" /> },
      { label: "Vendors", href: "/vendors", icon: <Building2 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Accounting",
    items: [
      { label: "Vouchers", href: "/vouchers", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Chart of Accounts", href: "/coa", icon: <ChevronRight className="h-4 w-4" /> },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Items", href: "/items", icon: <Boxes className="h-4 w-4" /> },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", href: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Users", href: "/users", icon: <Shield className="h-4 w-4" /> },
      { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 grid place-items-center">
          <span className="text-sm font-semibold text-primary">L</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Lekhaly</div>
          <div className="text-xs text-muted-foreground">Accounting</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <div className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground">
              {g.title}
            </div>

            <div className="space-y-1">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    <span className={active ? "text-primary" : "text-muted-foreground"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="truncate">Enterprise UI</span>
          <span className="mono-numbers">v0.1</span>
        </div>
      </div>
    </aside>
  );
}
