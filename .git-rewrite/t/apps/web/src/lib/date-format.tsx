// apps/web/src/lib/date-format.tsx
"use client";

import * as React from "react";

export type DateFormat = "bs" | "ad";

const STORAGE_KEY = "lekhaly.dateFormat";

function parseDateFormat(value: string | null | undefined): DateFormat {
  return value === "ad" ? "ad" : "bs";
}

type DateFormatContextValue = {
  dateFormat: DateFormat;
  setDateFormat: (next: DateFormat) => void;
};

const DateFormatContext = React.createContext<DateFormatContextValue | undefined>(undefined);

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormatState] = React.useState<DateFormat>("bs");

  React.useEffect(() => {
    const stored = parseDateFormat(window.localStorage.getItem(STORAGE_KEY));
    setDateFormatState(stored);
  }, []);

  const setDateFormat = React.useCallback((next: DateFormat) => {
    setDateFormatState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = React.useMemo(() => ({ dateFormat, setDateFormat }), [dateFormat, setDateFormat]);

  return <DateFormatContext.Provider value={value}>{children}</DateFormatContext.Provider>;
}

export function useDateFormat() {
  const ctx = React.useContext(DateFormatContext);
  if (!ctx) {
    throw new Error("useDateFormat must be used within DateFormatProvider");
  }
  return ctx;
}

