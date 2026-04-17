"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string | number;
  className?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string;
};

export default function DataTable<T>({
  rows,
  columns,
  loading,
  emptyText = "No data found",
  className,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const [colWidths, setColWidths] = React.useState<Record<string, number>>({});
  const resizingRef = React.useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  React.useEffect(() => {
    setColWidths((prev) => {
      const next = { ...prev };
      columns.forEach((c) => {
        if (next[c.key] != null) return;
        if (typeof c.width === "number") {
          next[c.key] = c.width;
          return;
        }
        if (typeof c.width === "string") {
          const parsed = Number.parseInt(c.width, 10);
          if (!Number.isNaN(parsed)) next[c.key] = parsed;
        }
      });
      return next;
    });
  }, [columns]);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const active = resizingRef.current;
      if (!active) return;
      const delta = e.clientX - active.startX;
      const nextWidth = Math.max(80, active.startWidth + delta);
      setColWidths((prev) => ({ ...prev, [active.key]: nextWidth }));
    };
    const onUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const getWidth = (c: Column<T>) => {
    const w = colWidths[c.key];
    if (typeof w === "number") return w;
    if (typeof c.width === "number") return c.width;
    if (typeof c.width === "string") {
      const parsed = Number.parseInt(c.width, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full w-full caption-bottom text-sm table-fixed">
          <thead className="[&_tr]:border-b">
            <tr className="border-b bg-muted/30 hover:bg-muted/30 transition-colors">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={getWidth(c) ? { width: getWidth(c), minWidth: getWidth(c) } : undefined}
                  className={cn(
                    "relative h-10 px-4 text-left align-middle font-medium text-muted-foreground border-r last:border-r-0 [&:has([role=checkbox])]:pr-0",
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left",
                    c.className
                  )}
                >
                  <span className="block truncate">{c.header}</span>
                  <span
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const th = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
                      const startWidth = th.offsetWidth;
                      resizingRef.current = {
                        key: c.key,
                        startX: e.clientX,
                        startWidth,
                      };
                      document.body.style.cursor = "col-resize";
                      document.body.style.userSelect = "none";
                    }}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
                    aria-hidden
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground py-8">
                    <p>{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    onRowClick ? "cursor-pointer" : "",
                    rowClassName
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={getWidth(c) ? { width: getWidth(c), minWidth: getWidth(c) } : undefined}
                      className={cn(
                        "p-4 align-middle border-r last:border-r-0 [&:has([role=checkbox])]:pr-0",
                        c.align === "right"
                          ? "text-right mono-numbers"
                          : c.align === "center"
                            ? "text-center"
                            : "text-left",
                        c.className
                      )}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

