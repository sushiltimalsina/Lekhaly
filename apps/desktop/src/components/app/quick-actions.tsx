import { Link, useLocation } from "react-router-dom";

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
      { label: "Create Invoice", href: "/sales/create" },
      { label: "Record Payment", href: "/payments/create" },
    ],
  },
  {
    title: "Sales",
    match: (path) => path.startsWith("/sales"),
    actions: [
      { label: "New Invoice", href: "/sales/create" },
      { label: "Sales List", href: "/sales" },
      { label: "View Reports", href: "/reports/sales-register" },
    ],
  },
  {
    title: "Purchase",
    match: (path) => path.startsWith("/purchase"),
    actions: [
      { label: "New Purchase", href: "/purchase/create" },
      { label: "Purchase List", href: "/purchase" },
      { label: "View Ledger", href: "/reports/ledger" },
    ],
  },
];

export default function QuickActionsRail() {
  const { pathname } = useLocation();
  const group = groups.find((entry) => entry.match(pathname));

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
                to={action.href}
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
