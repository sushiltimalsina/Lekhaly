// apps/desktop/src/components/app/data-table.tsx
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
  emptyState?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
};

export default function DataTable<T>({
  rows,
  columns,
  loading,
  emptyText = "No data found",
  emptyState,
  className,
  onRowClick,
  rowClassName,
  pagination,
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
          const parsed = parseInt(c.width, 10);
          if (!isNaN(parsed)) next[c.key] = parsed;
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
      const parsed = parseInt(c.width, 10);
      if (!isNaN(parsed)) return parsed;
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
                    "relative h-11 px-4 text-left align-middle font-semibold text-muted-foreground border-r last:border-r-0",
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
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors"
                    aria-hidden
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="[&_tr:last-child]:border-0 font-medium">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  {emptyState ? (
                    <div className="py-12">{emptyState}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground py-12">
                      <p className="font-semibold">{emptyText}</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/40",
                    onRowClick ? "cursor-pointer" : "",
                    rowClassName
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={getWidth(c) ? { width: getWidth(c), minWidth: getWidth(c) } : undefined}
                      className={cn(
                        "p-4 align-middle border-r last:border-r-0",
                        c.align === "right"
                          ? "text-right mono-numbers tabular-nums"
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
      
      {pagination && (
        <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Displaying {Math.min(pagination.total, (pagination.page - 1) * pagination.pageSize + 1)} - {Math.min(pagination.total, pagination.page * pagination.pageSize)} of {pagination.total} records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border bg-background text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <div className="h-8 flex items-center px-4 rounded-lg bg-slate-900 text-white text-[10px] font-black tabular-nums">
              Page {pagination.page}
            </div>
            <button
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border bg-background text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
