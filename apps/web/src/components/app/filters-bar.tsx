"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FiltersBarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function FiltersBar({ left, right, className }: FiltersBarProps) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 rounded-xl bg-card/50 p-1 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{left}</div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}
