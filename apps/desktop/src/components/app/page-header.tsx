"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
  icon?: any;
  iconContainerClassName?: string;
};

export default function PageHeader({ title, description, actions, breadcrumb, className, icon: Icon, iconContainerClassName }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-white shrink-0",
            iconContainerClassName || "bg-orange-600 shadow-lg shadow-orange-500/20"
          )}>
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

