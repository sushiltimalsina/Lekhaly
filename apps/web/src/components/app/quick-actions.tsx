"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ActionItem = {
  label: string;
  href: string;
  helper?: string;
};

type ActionGroup = {
  title: string;
  actions: ActionItem[];
  match: (path: string) => boolean;
};

const groups: ActionGroup[] = [
  {
    title: "Quick Actions",
    match: (path) => path.startsWith("/dashboard"),
    actions: [
      { label: "Create Voucher", href: "/vouchers" },
      { label: "Create Invoice", href: "/invoices" },
      { label: "Record Payment", href: "/payments" },
    ],
  },
  {
    title: "Vouchers",
    match: (path) => path.startsWith("/vouchers"),
    actions: [
      { label: "New Voucher", href: "/vouchers", helper: "Create or post vouchers" },
      { label: "Export PDF", href: "/coming-soon" },
      { label: "View Reports", href: "/reports" },
    ],
  },
  {
    title: "Invoices",
    match: (path) => path.startsWith("/invoices"),
    actions: [
      { label: "New Invoice", href: "/invoices" },
      { label: "Send Reminder", href: "/coming-soon" },
      { label: "View Reports", href: "/reports" },
    ],
  },
  {
    title: "Payments",
    match: (path) => path.startsWith("/payments"),
    actions: [
      { label: "New Payment", href: "/payments" },
      { label: "Reconcile", href: "/coming-soon" },
      { label: "View Ledger", href: "/reports/ledger" },
    ],
  },

];

export default function QuickActionsRail() {
  const pathname = usePathname();
  const group = groups.find((g) => g.match(pathname));

  if (!group || pathname.includes("/create")) return null;

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {group.title}
          </div>
          <div className="mt-4 space-y-2">
            {group.actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="block rounded-xl border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <div>{action.label}</div>
                {action.helper ? (
                  <div className="mt-1 text-xs text-muted-foreground">{action.helper}</div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
          Tip: Use Ctrl+K to jump to any module quickly.
        </div>
      </div>
    </aside>
  );
}
