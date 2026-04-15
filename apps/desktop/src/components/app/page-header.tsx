// apps/desktop/src/components/app/page-header.tsx
import React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  icon?: any;
};

export default function PageHeader({ title, description, actions, className, icon: Icon }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <h1 className="text-2xl font-bold font-heading tracking-tight text-gradient">{title}</h1>
        </div>
        {description && <p className="text-sm text-muted-foreground font-medium ml-0 sm:ml-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
