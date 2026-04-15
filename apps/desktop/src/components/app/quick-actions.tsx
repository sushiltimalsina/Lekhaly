// apps/desktop/src/components/app/quick-actions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, FileText, ShoppingCart, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickActionsRail() {
  const actions = [
    { icon: Plus, label: "Add Transaction", href: "/sales/create", color: "text-blue-500" },
    { icon: Receipt, label: "New Receipt", href: "/receipts/create", color: "text-green-500" },
    { icon: FileText, label: "New Invoice", href: "/sales/create", color: "text-purple-500" },
    { icon: ShoppingCart, label: "New Order", href: "/sales-orders/create", color: "text-orange-500" },
    { icon: BookOpen, label: "New Journal", href: "/journals/create", color: "text-rose-500" },
  ];

  return (
    <aside className="w-16 hidden lg:flex flex-col items-center gap-4 pt-2">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest vertical-text mb-2">
        Quick
      </div>
      {actions.map((action, i) => (
        <Link key={i} to={action.href}>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-12 w-12 rounded-xl bg-card border shadow-sm hover:scale-105 transition-transform", action.color)}
            title={action.label}
          >
            <action.icon className="h-5 w-5" />
          </Button>
        </Link>
      ))}
    </aside>
  );
}

// Helper for vertical text
const cn = (...args: any[]) => args.filter(Boolean).join(" ");
