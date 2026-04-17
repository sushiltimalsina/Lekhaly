"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
        <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2 sm:self-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

