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
  ChevronDown,
  PieChart,
  Plus,
  List,
  Eye,
  CreditCard,
  RefreshCcw,
  ScrollText,
  Landmark,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  label: string;
  icon?: any;
  href?: string;
  children?: NavItem[];
};

const navData: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Transactions",
    icon: ScrollText,
    children: [
      {
        label: "Sales",
        icon: FileText,
        children: [
          { label: "Add (Create)", href: "/sales/create", icon: Plus },
          { label: "View", href: "/sales/view", icon: Eye },
          { label: "List", href: "/sales", icon: List },
        ]
      },
      {
        label: "Purchase",
        icon: Building2,
        children: [
          { label: "Add (Create)", href: "/purchase/create", icon: Plus },
          { label: "View", href: "/purchase/view", icon: Eye },
          { label: "List", href: "/purchase", icon: List },
        ]
      },
      {
        label: "Sales Return",
        icon: RefreshCcw,
        children: [
          { label: "Add (Create)", href: "/sales-return/create", icon: Plus },
          { label: "View", href: "/sales-return/view", icon: Eye },
          { label: "List", href: "/sales-return", icon: List },
        ]
      },
      {
        label: "Purchase Return",
        icon: RefreshCcw,
        children: [
          { label: "Add (Create)", href: "/purchase-return/create", icon: Plus },
          { label: "View", href: "/purchase-return/view", icon: Eye },
          { label: "List", href: "/purchase-return", icon: List },
        ]
      },
      {
        label: "Payment",
        icon: Wallet,
        children: [
          { label: "Add (Create)", href: "/payments/create", icon: Plus },
          { label: "View", href: "/payments/view", icon: Eye },
          { label: "List", href: "/payments", icon: List },
        ]
      },
      {
        label: "Receipt",
        icon: Receipt,
        children: [
          { label: "Add (Create)", href: "/receipts/create", icon: Plus },
          { label: "View", href: "/receipts/view", icon: Eye },
          { label: "List", href: "/receipts", icon: List },
        ]
      },
      {
        label: "Journal",
        icon: BookOpen,
        children: [
          { label: "Add (Create)", href: "/journals/create", icon: Plus },
          { label: "View", href: "/journals/view", icon: Eye },
          { label: "List", href: "/journals", icon: List },
        ]
      }
    ]
  },
  {
    label: "Reports",
    icon: PieChart,
    children: [
      { label: "Display", href: "/reports/display", icon: Eye },
      { label: "Profit & Loss", href: "/reports/pl", icon: FileText },
      { label: "Balance Sheet", href: "/reports/balance-sheet", icon: FileText },
      { label: "Trial Balance", href: "/reports/trial-balance", icon: FileText },
    ]
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: Building2
  },
  {
    label: "Stock",href: "/items",
    icon: Package,
    children: [
      { label: "Add (Create)", href: "/items/new", icon: Plus },
      { label: "List", href: "/items", icon: List }
    ]
  },
  {
    label: "Chart of Accounts",
    href: "/coa",
    icon: Receipt
  },
  {
    label: "Users",
    href: "/users",
    icon: Users
  },
  {
    label: "Banks/Accounts",
    href: "/banks",
    icon: Landmark
  },
  {
    label: "Configuration",
    href: "/configuration",
    icon: Settings
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate?: () => void;
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
  return (
    <aside className={cn("h-screen w-[280px] border-r bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-card/20 flex flex-col", className)}>
      {/* Brand */}
      <div className="px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="font-heading text-lg font-bold tracking-tight text-foreground">Lekhaly</div>
            <div className="text-xs font-medium text-muted-foreground">Accounting</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {navData.map((item, i) => (
          <NavItemNode key={i} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}

function NavItemNode({ item, depth = 0, onNavigate }: { item: NavItem; depth?: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Check if any child is active to auto-expand
  const hasActiveChild = React.useMemo(() => {
    const check = (node: NavItem): boolean => {
      if (node.href && (pathname === node.href || pathname?.startsWith(node.href + "/"))) return true;
      if (node.children) return node.children.some(check);
      return false;
    };
    return check(item);
  }, [pathname, item]);

  React.useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  const isActive = item.href ? (pathname === item.href || pathname?.startsWith(item.href + "/")) : false;
  const isChildActive = hasActiveChild && !isActive;
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
          isActive
            ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          depth > 0 && "text-xs"
        )}
        style={{ paddingLeft: `${16 + depth * 12}px` }}
      >
        {isActive ? (
          <span className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
        ) : null}
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        )}
        <span className="flex-1 truncate">{item.label}</span>
        {isActive && depth === 0 ? <ChevronRight className="h-4 w-4 opacity-50" /> : null}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
          isOpen || isActive || isChildActive
            ? "bg-muted/50 text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${16 + depth * 12}px` }}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
              isActive || isChildActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col space-y-1">
              {item.children?.map((child, i) => (
                <NavItemNode key={i} item={child} depth={depth + 1} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
