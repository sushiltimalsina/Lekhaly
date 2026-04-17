"use client";

import { Link, useLocation } from "react-router-dom";
import { 
  Receipt, 
  PlusCircle, 
  Wallet, 
  UserPlus, 
  Box, 
  PieChart, 
  FileText, 
  ShoppingCart, 
  RefreshCcw, 
  BookOpen, 
  Building2,
  ClipboardList 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@lekhaly/ui";

type ActionItem = {
  label: string;
  href?: string;
  icon: any;
  variant?: "default" | "vibrant" | "danger";
  dropdown?: { label: string; href: string; icon?: any }[];
};

type ActionGroup = {
  title: string;
  actions: ActionItem[];
  match: (path: string) => boolean;
};

const groups: ActionGroup[] = [
  {
    title: "Quick Start",
    match: (path) => path.startsWith("/dashboard") || path === "/",
    actions: [
      { 
        label: "Invoice", 
        icon: FileText,
        variant: "vibrant",
        dropdown: [
          { label: "Sales", href: "/sales/create", icon: FileText },
          { label: "Purchase", href: "/purchase/create", icon: Building2 },
          { label: "Sales Return", href: "/sales-return/create", icon: RefreshCcw },
          { label: "Purchase Return", href: "/purchase-return/create", icon: RefreshCcw },
        ]
      },
      { 
        label: "Vouchers", 
        icon: Receipt,
        variant: "vibrant",
        dropdown: [
          { label: "Receipt", href: "/receipts/create", icon: Receipt },
          { label: "Payment", href: "/payments/create", icon: Wallet },
          { label: "Journal", href: "/journals/create", icon: BookOpen },
        ]
      },
      { 
        label: "Orders", 
        icon: ShoppingCart,
        dropdown: [
          { label: "Sales Order", href: "/sales-orders/create", icon: FileText },
          { label: "Purchase Order", href: "/purchase-orders/create", icon: Building2 },
        ]
      },
      { label: "Quotations", icon: ClipboardList, href: "/quotations/create" },
      { label: "Stock (Add New)", icon: Box, href: "/items/new" },
      { 
        label: "Reports", 
        icon: PieChart,
        dropdown: [
          { label: "Trial Balance", href: "/reports/trial-balance", icon: FileText },
          { label: "P&L", href: "/reports/pl", icon: FileText },
          { label: "Balance Sheets", href: "/reports/balance-sheet", icon: FileText },
          { label: "Other Reports", href: "/reports/other", icon: FileText },
        ]
      },
      { label: "Customers", icon: UserPlus, href: "/customers/new" },
      { label: "Vendors", icon: Building2, href: "/vendors/new" },
    ],
  },
  {
    title: "Invoices",
    match: (path) => path.startsWith("/sales"),
    actions: [
      { label: "New Sales", href: "/sales/create", icon: PlusCircle },
      { label: "Return", href: "/sales-return/create", icon: RefreshCcw },
      { label: "Reports", href: "/reports/sales-register", icon: PieChart },
    ],
  },
  {
    title: "Payments",
    match: (path) => path.startsWith("/payments"),
    actions: [
      { label: "New Entry", href: "/payments/create", icon: Wallet },
      { label: "Ledger", href: "/reports/ledger", icon: BookOpen },
      { label: "Reports", href: "/reports/payable-summary", icon: PieChart },
    ],
  },
];

function ActionButton({ action }: { action: ActionItem }) {
  const Icon = action.icon;
  
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl border bg-background p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-90 group",
      action.variant === "vibrant" 
        ? "border-primary/20 bg-primary/5 hover:bg-primary/10" 
        : "hover:bg-muted/50"
    )}>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
        action.variant === "vibrant"
          ? "bg-primary text-white shadow-lg shadow-primary/25 group-hover:scale-110"
          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
      )}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  if (action.dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full focus:outline-none" title={action.label}>
            {content}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64" sideOffset={15}>
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3 py-2">Select {action.label} Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-1">
            {action.dropdown.map((sub) => {
              const SubIcon = sub.icon || PlusCircle;
              return (
                <DropdownMenuItem key={sub.label} asChild>
                  <Link to={sub.href} className="w-full">
                    <div className="flex items-center py-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 mr-3">
                        <SubIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{sub.label}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link to={action.href || "#"} className="w-full focus:outline-none" title={action.label}>
      {content}
    </Link>
  );
}

export default function QuickActionsRail() {
  const { pathname } = useLocation();
  
  // Only show on the Dashboard
  if (pathname !== "/dashboard" && pathname !== "/") return null;

  const group = groups.find((g) => g.match(pathname));
  if (!group) return null;

  return (
    <aside className="hidden xl:block w-24 shrink-0 transition-all duration-300">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-[32px] border bg-card/50 backdrop-blur-xl p-3 shadow-sm border-primary/5">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="h-1 w-6 rounded-full bg-primary/20 mb-2" />
            
            <div className="flex flex-col gap-4">
              {group.actions.map((action, i) => (
                <ActionButton key={i} action={action} />
              ))}
            </div>
            
            <div className="h-px w-8 bg-muted my-2" />
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/40" title="More Actions coming soon">
               <PlusCircle className="h-5 w-5 opacity-20" />
            </div>
          </div>
        </div>
        
        <div className="rounded-full border bg-card/30 backdrop-blur-sm p-3 text-center text-muted-foreground/40 hover:text-primary transition-colors cursor-help" title="Quick Shortcuts help">
          <PieChart className="h-4 w-4 mx-auto" />
        </div>
      </div>
    </aside>
  );
}



