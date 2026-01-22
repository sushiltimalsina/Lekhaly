"use client";

import * as React from "react";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string | number;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
};

export default function DataTable<T>({
  rows,
  columns,
  loading,
  emptyText = "No data found",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={[
                    "px-3 py-2 text-xs font-medium text-muted-foreground",
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                      ? "text-center"
                      : "text-left",
                  ].join(" ")}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-muted/40">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={[
                        "px-3 py-2",
                        c.align === "right"
                          ? "text-right mono-numbers"
                          : c.align === "center"
                          ? "text-center"
                          : "text-left",
                      ].join(" ")}
                    >
                      {c.cell(row)}
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
