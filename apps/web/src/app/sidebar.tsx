"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavChild = {
  title: string;
  href: string;
};

type NavItem = {
  id: string;
  title: string;
  href?: string;
  children?: NavChild[];
  basePaths?: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Core Modules",
    items: [
      { id: "dashboard", title: "Dashboard", href: "/dashboard", basePaths: ["/dashboard"] }
    ]
  },
  {
    title: "Transactions",
    items: [
      {
        id: "sales",
        title: "Sales",
        basePaths: ["/vouchers"],
        children: [
          { title: "Create", href: "/vouchers?type=sales&mode=add" },
          { title: "View", href: "/vouchers?type=sales&mode=view" },
          { title: "List", href: "/vouchers?type=sales&mode=list" }
        ]
      },
      {
        id: "purchase",
        title: "Purchase",
        basePaths: ["/vouchers"],
        children: [
          { title: "Create", href: "/vouchers?type=purchase&mode=add" },
          { title: "View", href: "/vouchers?type=purchase&mode=view" },
          { title: "List", href: "/vouchers?type=purchase&mode=list" }
        ]
      },
      {
        id: "sales-return",
        title: "Sales Return (Credit Note)",
        basePaths: ["/vouchers"],
        children: [
          { title: "Create", href: "/vouchers?type=sales-return&mode=add" },
          { title: "View", href: "/vouchers?type=sales-return&mode=view" },
          { title: "List", href: "/vouchers?type=sales-return&mode=list" }
        ]
      },
      {
        id: "purchase-return",
        title: "Purchase Return (Debit Note)",
        basePaths: ["/vouchers"],
        children: [
          { title: "Create", href: "/vouchers?type=purchase-return&mode=add" },
          { title: "View", href: "/vouchers?type=purchase-return&mode=view" },
          { title: "List", href: "/vouchers?type=purchase-return&mode=list" }
        ]
      },
      {
        id: "payment",
        title: "Payment",
        basePaths: ["/payments"],
        children: [
          { title: "Create", href: "/payments?mode=add" },
          { title: "View", href: "/payments?mode=view" },
          { title: "List", href: "/payments?mode=list" }
        ]
      },
      {
        id: "receipt",
        title: "Receipt",
        basePaths: ["/payments"],
        children: [
          { title: "Create", href: "/payments?type=receipt&mode=add" },
          { title: "View", href: "/payments?type=receipt&mode=view" },
          { title: "List", href: "/payments?type=receipt&mode=list" }
        ]
      },
      {
        id: "journal",
        title: "Journal",
        basePaths: ["/vouchers"],
        children: [
          { title: "Create", href: "/vouchers?type=journal&mode=add" },
          { title: "View", href: "/vouchers?type=journal&mode=view" },
          { title: "List", href: "/vouchers?type=journal&mode=list" }
        ]
      }
    ]
  },
  {
    title: "Business Operations",
    items: [
      { id: "customers", title: "Customers", href: "/customers", basePaths: ["/customers"] },
      { id: "vendors", title: "Vendors", href: "/vendors", basePaths: ["/vendors"] },
      { id: "items", title: "Items", href: "/items", basePaths: ["/items"] },
      { id: "users", title: "Users", href: "/users", basePaths: ["/users"] },
      { id: "coa", title: "CoA", href: "/coa", basePaths: ["/coa"] }
    ]
  },
  {
    title: "Reports",
    items: [
      { id: "reports", title: "Profit & Loss", href: "/reports?tab=pl", basePaths: ["/reports"] },
      { id: "balance-sheet", title: "Balance Sheet", href: "/reports?tab=bs", basePaths: ["/reports"] },
      { id: "trial-balance", title: "Trial Balance", href: "/reports?tab=tb", basePaths: ["/reports"] }
    ]
  },
  {
    title: "Administration",
    items: [
      { id: "invoices", title: "Invoices", href: "/invoices", basePaths: ["/invoices"] },
      { id: "settings", title: "Settings", href: "/settings", basePaths: ["/settings"] }
    ]
  }
];

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {navSections.map((section) => (
        <div key={section.title}>
          <div className="rounded-2xl border border-white/20 bg-white/60 p-4 text-xs uppercase tracking-[0.3em] text-muted-foreground dark:border-white/10 dark:bg-white/5">
            {section.title}
          </div>
          <nav className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {section.items.map((item) => {
              if (!item.children) {
                return (
                  <Link
                    key={item.id}
                    href={item.href ?? "#"}
                    onClick={onNavigate}
                    className="rounded-xl px-3 py-2 transition hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5"
                  >
                    {item.title}
                  </Link>
                );
              }

              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/30 dark:border-white/5 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground"
                  >
                    <span>{item.title}</span>
                    <span
                      className={`text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                  </button>
                  <div
                    className={`grid gap-1 overflow-hidden px-3 pb-3 text-xs text-muted-foreground transition-all ${
                      isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href}
                        onClick={() => {
                          setOpenId(null);
                          onNavigate?.();
                        }}
                        className="rounded-lg px-2 py-1 transition hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
