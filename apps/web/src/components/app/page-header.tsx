"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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

function shouldAutoShowBack(pathname: string, breadcrumb?: React.ReactNode) {
  if (breadcrumb) return false;
  if (!pathname || pathname === "/" || pathname === "/dashboard") return false;
  if (pathname.startsWith("/reports/")) return false;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "create" || segment === "new" || segment === "edit" || segment === "view")) return true;
  return segments.length === 2 && detailRoots.has(segments[0]);
}

export default function PageHeader({ title, description, actions, breadcrumb, className, icon: Icon, showBack, backHref, backLabel = "Back" }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowBack = showBack ?? shouldAutoShowBack(pathname, breadcrumb);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(backHref || getFallbackHref(pathname));
  };

  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-4">
        {shouldShowBack && (
          <button
            type="button"
            onClick={goBack}
            aria-label={backLabel}
            title={backLabel}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-500/20 shrink-0">
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
  );
}
