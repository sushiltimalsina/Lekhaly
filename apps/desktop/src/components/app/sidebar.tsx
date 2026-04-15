// apps/desktop/src/components/app/sidebar.tsx
import * as React from "react";
import { useLocation, Link } from "react-router-dom";
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
  RefreshCcw,
  ScrollText,
  Landmark,
  ShoppingCart,
  ClipboardList,
  KeyRoundIcon
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
          { label: "List", href: "/sales", icon: List },
        ]
      },
      {
        label: "Purchase",
        icon: Building2,
        children: [
          { label: "Add (Create)", href: "/purchase/create", icon: Plus },
          { label: "List", href: "/purchase", icon: List },
        ]
      },
      {
        label: "Sales Return",
        icon: RefreshCcw,
        children: [
          { label: "Add (Create)", href: "/sales-return/create", icon: Plus },
          { label: "List", href: "/sales-return", icon: List },
        ]
      },
      {
        label: "Purchase Return",
        icon: RefreshCcw,
        children: [
          { label: "Add (Create)", href: "/purchase-return/create", icon: Plus },
          { label: "List", href: "/purchase-return", icon: List },
        ]
      },
      {
        label: "Payment",
        icon: Wallet,
        children: [
          { label: "Add (Create)", href: "/payments/create", icon: Plus },
          { label: "List", href: "/payments", icon: List },
        ]
      },
      {
        label: "Receipt",
        icon: Receipt,
        children: [
          { label: "Add (Create)", href: "/receipts/create", icon: Plus },
          { label: "List", href: "/receipts", icon: List },
        ]
      },
      {
        label: "Journal",
        icon: BookOpen,
        children: [
          { label: "Add (Create)", href: "/journals/create", icon: Plus },
          { label: "List", href: "/journals", icon: List },
        ]
      }
    ]
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      {
        label: "Sales Order",
        icon: FileText,
        children: [
          { label: "Add (Create)", href: "/sales-orders/create", icon: Plus },
          { label: "List", href: "/sales-orders", icon: List },
        ]
      },
      {
        label: "Purchase Order",
        icon: Building2,
        children: [
          { label: "Add (Create)", href: "/purchase-orders/create", icon: Plus },
          { label: "List", href: "/purchase-orders", icon: List },
        ]
      }
    ]
  },
  {
    label: "Quotations",
    icon: ClipboardList,
    children: [
      { label: "Add (Create)", href: "/quotations/create", icon: Plus },
      { label: "List", href: "/quotations", icon: List },
    ]
  },
  {
    label: "Stock", href: "/items",
    icon: Package,
    children: [
      { label: "Add (Create)", href: "/items/new", icon: Plus },
      { label: "List", href: "/items", icon: List }
    ]
  },
  {
    label: "Reports",
    icon: PieChart,
    children: [
      { label: "General Ledger", href: "/reports/ledger", icon: BookOpen },
      { label: "Profit & Loss", href: "/reports/pl", icon: FileText },
      { label: "Balance Sheet", href: "/reports/balance-sheet", icon: FileText },
      { label: "Trial Balance", href: "/reports/trial-balance", icon: FileText },
      { label: "Other Reports", href: "/reports/other", icon: Eye },
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
    icon: KeyRoundIcon
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
  const [collapsed, setCollapsed] = React.useState(true);
  const [resetSignal, setResetSignal] = React.useState(0);

  React.useEffect(() => {
    const stored = localStorage.getItem("lekhaly.sidebar.collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  React.useEffect(() => {
    localStorage.setItem("lekhaly.sidebar.collapsed", String(collapsed));
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "84px" : "280px"
    );
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const handleNavigate = () => {
    setCollapsed(true);
    setResetSignal((prev) => prev + 1);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "h-screen border-r bg-card/50 backdrop-blur-xl supports-[backdrop-filter]:bg-card/20 flex flex-col transition-[width] duration-200",
        collapsed ? "w-[84px]" : "w-[280px]",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("px-6 py-6 flex-shrink-0", collapsed && "px-4")}>
        <div className={cn("flex items-center gap-3 px-2", collapsed && "px-0 justify-center")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Receipt className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-heading text-lg font-bold tracking-tight text-foreground">Lekhaly</div>
              <div className="text-xs font-medium text-muted-foreground">Accounting</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "mt-4 flex items-center justify-center rounded-lg border px-2 py-1 text-xs text-muted-foreground hover:bg-muted",
            collapsed ? "mx-auto w-10" : "w-full"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-2 space-y-1 custom-scrollbar", collapsed ? "px-2" : "px-4")}>
        {navData.map((item, i) => (
          <NavItemNode
            key={i}
            item={item}
            onNavigate={handleNavigate}
            collapsed={collapsed}
            onExpand={() => setCollapsed(false)}
            resetSignal={resetSignal}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavItemNode({
  item,
  depth = 0,
  onNavigate,
  collapsed,
  onExpand,
  onChildNavigate,
  resetSignal
}: {
  item: NavItem;
  depth?: number;
  onNavigate?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
  onChildNavigate?: () => void;
  resetSignal?: number;
}) {
  const { pathname } = useLocation();
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
    if (!resetSignal) return;
    setIsOpen(false);
  }, [resetSignal]);

  const isActive = item.href ? (pathname === item.href || pathname?.startsWith(item.href + "/")) : false;
  const isChildActive = hasActiveChild && !isActive;
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const handleNavigate = () => {
    onChildNavigate?.();
    onNavigate?.();
  };

  if (!hasChildren && item.href) {
    return (
      <Link
        to={item.href}
        onClick={handleNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
          isActive
            ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          depth > 0 && "text-xs",
          collapsed && "justify-center px-2"
        )}
        style={collapsed ? undefined : { paddingLeft: `${16 + depth * 12}px` }}
        title={collapsed ? item.label : undefined}
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
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && isActive && depth === 0 ? <ChevronRight className="h-4 w-4 opacity-50" /> : null}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          if (collapsed) {
            onExpand?.();
            setIsOpen(true);
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "w-full group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
          isOpen || isActive || isChildActive
            ? "bg-muted/50 text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          collapsed && "justify-center px-2"
        )}
        style={collapsed ? undefined : { paddingLeft: `${16 + depth * 12}px` }}
        title={collapsed ? item.label : undefined}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
              isActive || isChildActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
        {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
        {!collapsed && (
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col space-y-1">
              {item.children?.map((child, i) => (
                <NavItemNode
                  key={i}
                  item={child}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                  onExpand={onExpand}
                  onChildNavigate={() => setIsOpen(false)}
                  resetSignal={resetSignal}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
