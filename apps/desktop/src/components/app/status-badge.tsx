"use client";

import * as React from "react";

export type DocStatus =
  | "draft" | "posted" | "void"
  | "open" | "fulfilled" | "cancelled"
  | "sent" | "accepted" | "declined" | "expired";

function stylesFor(status: DocStatus) {
  switch (status) {
    case "draft":
      return "border bg-background text-foreground/80";
    case "posted":
    case "accepted":
    case "fulfilled":
      return "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300";
    case "open":
    case "sent":
      return "border border-indigo-600/30 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300";
    case "void":
    case "cancelled":
    case "declined":
    case "expired":
      return "border border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-300";
    default:
      return "border bg-background text-foreground/80";
  }
}

function labelFor(status: DocStatus) {
  switch (status) {
    case "draft": return "Draft";
    case "posted": return "Posted";
    case "void": return "Voided";
    case "open": return "Open";
    case "fulfilled": return "Fulfilled";
    case "cancelled": return "Cancelled";
    case "sent": return "Sent";
    case "accepted": return "Accepted";
    case "declined": return "Declined";
    case "expired": return "Expired";
    default: return status;
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

