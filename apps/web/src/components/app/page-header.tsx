"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, List } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
  icon?: any;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
};

const detailRoots = new Set([
  "items",
  "purchase",
  "purchase-orders",
  "quotations",
  "sales",
  "sales-orders",
  "vouchers"
]);

function getFallbackHref(pathname: string) {
  if (pathname.startsWith("/inventory/stock-counts/")) return "/inventory/stock-counts";
  if (pathname.startsWith("/sales/return/create")) return "/sales-return";
  if (pathname.startsWith("/purchase-return/create")) return "/purchase-return";
  if (pathname.startsWith("/sales-return/create")) return "/sales-return";
  if (pathname.startsWith("/contras/create")) return "/vouchers?type=contra";

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (!first) return "/dashboard";

  if (detailRoots.has(first)) return `/${first}`;
  if (segments.includes("create") || segments.includes("new") || segments.includes("edit") || segments.includes("view")) {
    return `/${first}`;
  }

  return "/dashboard";
}

function getRegistryLabel(pathname: string, backHref?: string) {
  const target = backHref || getFallbackHref(pathname);
  const map: Record<string, string> = {
    "/sales": "Sales Register",
    "/purchase": "Purchase Register",
    "/sales-return": "Sales Returns",
    "/purchase-return": "Purchase Returns",
    "/sales-orders": "Sales Orders",
    "/purchase-orders": "Purchase Orders",
    "/quotations": "Quotations",
    "/vouchers": "Vouchers",
    "/items": "Items",
    "/receipts": "Receipts",
    "/payments": "Payments",
    "/journals": "Journals",
    "/customers": "Customers",
    "/vendors": "Vendors",
    "/inventory/stock-counts": "Stock Counts",
    "/inventory": "Inventory",
  };
  return map[target] || "Register";
}

function shouldAutoShowBack(pathname: string, breadcrumb?: React.ReactNode) {
  if (breadcrumb) return false;
  if (!pathname || pathname === "/" || pathname === "/dashboard") return false;
  if (pathname.startsWith("/reports/")) return false;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "create" || segment === "new" || segment === "edit" || segment === "view")) return true;
  return segments.length === 2 && detailRoots.has(segments[0]);
}

function BackButton({
  onBack,
  onRegistry,
  registryLabel,
}: {
  onBack: () => void;
  onRegistry: () => void;
  registryLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="relative -mt-3.5 mb-14 inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Main back button - Direct click goes back in history */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-3.5 pr-4 text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:border-orange-500 dark:hover:bg-orange-950/40 dark:hover:text-orange-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Hover dropdown showing single Back to Registry shortcut */}
      <div
        className={cn(
          "absolute left-0 top-full z-50 pt-1.5 min-w-[210px] transition-all duration-150 ease-out",
          open ? "pointer-events-auto translate-y-0 opacity-100 scale-100" : "pointer-events-none -translate-y-1 opacity-0 scale-95"
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1 shadow-2xl shadow-slate-900/10 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => { setOpen(false); onRegistry(); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-orange-950/40 dark:hover:text-orange-400"
          >
            <List className="h-4 w-4 shrink-0 text-orange-500 dark:text-orange-400" />
            <span>Back to {registryLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PageHeader({ title, description, actions, breadcrumb, className, icon: Icon, showBack, backHref, backLabel = "Back", onBack }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowBack = showBack ?? shouldAutoShowBack(pathname, breadcrumb);
  const registryLabel = getRegistryLabel(pathname, backHref);

  const handleBack = () => {
    const navigateBack = () => {
      if (onBack) {
        onBack();
        return;
      }
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push(backHref || getFallbackHref(pathname));
    };

    if (typeof window !== "undefined") {
      const guard = (window as any).lekhalyUnsavedChanges;
      if (guard && !guard.requestNavigation(navigateBack)) return;
    }

    navigateBack();
  };

  const handleRegistry = () => {
    const target = backHref || getFallbackHref(pathname);
    const navigateRegistry = () => router.push(target);

    if (typeof window !== "undefined") {
      const guard = (window as any).lekhalyUnsavedChanges;
      if (guard && !guard.requestNavigation(navigateRegistry)) return;
    }

    navigateRegistry();
  };

  return (
    <div className={cn("mb-6 flex flex-col gap-3", className)}>
      {shouldShowBack && (
        <BackButton
          onBack={handleBack}
          onRegistry={handleRegistry}
          registryLabel={registryLabel}
        />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="space-y-1">
            {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
            <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2 sm:self-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
