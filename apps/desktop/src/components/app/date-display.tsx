// apps/web/src/components/app/date-display.tsx
"use client";

import * as React from "react";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import clsx from "clsx";

type DateDisplayProps = {
  ad?: string;
  bs?: string;
  className?: string;
};

export default function DateDisplay({ ad, bs, className }: DateDisplayProps) {
  const { dateFormat } = useDateFormat();
  const display = React.useMemo(() => getDateDisplay({ ad, bs, format: dateFormat }), [ad, bs, dateFormat]);

  return (
    <div className={clsx("min-w-0", className)}>
      <div className="mono-numbers">{display.primary}</div>
      {display.secondary ? (
        <div className="text-xs text-muted-foreground">{display.secondary}</div>
      ) : null}
    </div>
  );
}


