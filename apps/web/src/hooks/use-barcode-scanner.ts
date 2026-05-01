import * as React from "react";

/**
 * Detects barcode scanner input — scanners emit characters extremely fast (< 50ms apart).
 * When a full scan is detected, onScan is called with the barcode string.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void, enabled = true) {
  const buffer = React.useRef<string>("");
  const lastKeyTime = React.useRef<number>(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input/textarea/select (user is typing)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();
      const timeDelta = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // If key arrived very quickly, treat as scanner input; otherwise reset
      if (timeDelta > 100 && buffer.current.length > 0) {
        buffer.current = "";
      }

      if (e.key === "Enter") {
        const scanned = buffer.current.trim();
        if (scanned.length >= 3) {
          onScan(scanned);
        }
        buffer.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
        // Auto-commit after 100ms silence (in case scanner doesn't send Enter)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const scanned = buffer.current.trim();
          if (scanned.length >= 3) {
            onScan(scanned);
          }
          buffer.current = "";
        }, 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onScan, enabled]);
}
