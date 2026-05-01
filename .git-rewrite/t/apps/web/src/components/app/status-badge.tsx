"use client";

import * as React from "react";

export type DocStatus = "draft" | "posted" | "void";

function stylesFor(status: DocStatus) {
  switch (status) {
    case "draft":
      return "border bg-background text-foreground/80";
    case "posted":
      return "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300";
    case "void":
      return "border border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-300";
    default:
      return "border bg-background text-foreground/80";
  }
}

function labelFor(status: DocStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "posted":
      return "Posted";
    case "void":
      return "Voided";
    default:
      return status;
  }
}

export default function StatusBadge({
  status,
  className,
}: {
  status: DocStatus;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        stylesFor(status),
        className ?? "",
      ].join(" ")}
    >
      {labelFor(status)}
    </span>
  );
}
