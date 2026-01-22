"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavChild = {
  label: string;
  href: string;
};

type NavItem = {
  id: string;
  label: string;
  href?: string;
  children?: NavChild[];
  basePaths?: string[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", href: "/dashboard", basePaths: ["/dashboard"] }],
  },
  {
    title: "Transactions",
    items: [
      {
        id: "sales",
        label: "Sales",
        basePaths: ["/vouchers"],
        children: [
          { label: "Add (Create)", href: "/vouchers?type=sales&mode=add" },
          { label: "View", href: "/vouchers?type=sales&mode=view" },
          { label: "List", href: "/vouchers?type=sales&mode=list" },
        ],
      },
      {
        id: "purchase",
        label: "Purchase",
        basePaths: ["/vouchers"],
        children: [
          { label: "Add (Create)", href: "/vouchers?type=purchase&mode=add" },
          { label: "View", href: "/vouchers?type=purchase&mode=view" },
          { label: "List", href: "/vouchers?type=purchase&mode=list" },
        ],
      },
      {
        id: "sales-return",
        label: "Sales Return (Credit Note)",
        basePaths: ["/vouchers"],
        children: [
          { label: "Add (Create)", href: "/vouchers?type=sales-return&mode=add" },
          { label: "View", href: "/vouchers?type=sales-return&mode=view" },
          { label: "List", href: "/vouchers?type=sales-return&mode=list" },
        ],
      },
      {
        id: "purchase-return",
        label: "Purchase Return (Debit Note)",
        basePaths: ["/vouchers"],
        children: [
          { label: "Add (Create)", href: "/vouchers?type=purchase-return&mode=add" },
          { label: "View", href: "/vouchers?type=purchase-return&mode=view" },
          { label: "List", href: "/vouchers?type=purchase-return&mode=list" },
        ],
      },
      {
        id: "payment",
        label: "Payment",
        basePaths: ["/payments"],
        children: [
          { label: "Add (Create)", href: "/payments?mode=add" },
          { label: "View", href: "/payments?mode=view" },
          { label: "List", href: "/payments?mode=list" },
        ],
      },
      {
        id: "receipt",
        label: "Receipt",
        basePaths: ["/payments"],
        children: [
          { label: "Add (Create)", href: "/payments?type=receipt&mode=add" },
          { label: "View", href: "/payments?type=receipt&mode=view" },
          { label: "List", href: "/payments?type=receipt&mode=list" },
        ],
      },
      {
        id: "journal",
        label: "Journal",
        basePaths: ["/vouchers"],
        children: [
          { label: "Add (Create)", href: "/vouchers?type=journal&mode=add" },
          { label: "View", href: "/vouchers?type=journal&mode=view" },
          { label: "List", href: "/vouchers?type=journal&mode=list" },
        ],
      },
    ],
  },
  {
    title: "Business Operations",
    items: [
      { id: "customers", label: "Customers", href: "/customers", basePaths: ["/customers"] },
      { id: "vendors", label: "Vendors", href: "/vendors", basePaths: ["/vendors"] },
      { id: "items", label: "Items", href: "/items", basePaths: ["/items"] },
      { id: "users", label: "Users", href: "/users", basePaths: ["/users"] },
      { id: "coa", label: "CoA", href: "/coa", basePaths: ["/coa"] },
    ],
  },
  {
    title: "Reports",
    items: [
      { id: "reports", label: "Profit & Loss", href: "/reports?tab=pl", basePaths: ["/reports"] },
      { id: "balance-sheet", label: "Balance Sheet", href: "/reports?tab=bs", basePaths: ["/reports"] },
      { id: "trial-balance", label: "Trial Balance", href: "/reports?tab=tb", basePaths: ["/reports"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "invoices", label: "Invoices", href: "/invoices", basePaths: ["/invoices"] },
      { id: "settings", label: "Settings", href: "/settings", basePaths: ["/settings"] },
    ],
  },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <span className="text-sm font-semibold text-primary">L</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Lekhaly</div>
          <div className="text-xs text-muted-foreground">Accounting</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                if (!item.children) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href ?? "#"}
                      onClick={onNavigate}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/80 transition hover:bg-muted hover:text-foreground"
                    >
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                }

                const isOpen = openId === item.id;
                const isActive = item.basePaths?.some((base) => pathname.startsWith(base));
                return (
                  <div key={item.id} className="rounded-lg border border-border/60 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className={[
                        "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium",
                        isActive ? "text-foreground" : "text-foreground/80",
                      ].join(" ")}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}
                        aria-hidden="true"
                      >
                        &gt;
                      </span>
                    </button>
                    <div
                      className={`grid gap-1 overflow-hidden px-2 text-xs text-muted-foreground transition-all ${
                        isOpen ? "max-h-64 pb-2 opacity-100" : "pointer-events-none max-h-0 pb-0 opacity-0"
                      }`}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            setOpenId(null);
                            onNavigate?.();
                          }}
                          className="rounded-md px-2 py-1 transition hover:bg-background hover:text-foreground"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="truncate">Enterprise UI</span>
          <span className="mono-numbers">v0.1</span>
        </div>
      </div>
    </aside>
  );
}
