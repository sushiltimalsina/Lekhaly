"use client";

import * as React from "react";

type FiltersBarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export default function FiltersBar({ left, right }: FiltersBarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}
