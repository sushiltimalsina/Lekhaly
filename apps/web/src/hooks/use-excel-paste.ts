import { useCallback } from 'react';

interface ExcelPasteOptions<T> {
  items: any[];
  onPaste: (newLines: T[]) => void;
  /**
   * Function to map a tab-separated row into a line object.
   * Return null if the row is invalid or should be skipped.
   */
  mapRow: (columns: string[], items: any[]) => T | null;
}

/**
 * useExcelPaste
 * Standardized hook to support "Modern Bold" Excel copy-paste workflows.
 */
export function useExcelPaste<T>(options: ExcelPasteOptions<T>) {
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // Only handle paste if it's coming from a focused area that isn't a text input
    // or if we want to explicitly allow it on the table.
    // Usually, we check if the target is not an input, but for bulk paste,
    // we often want to trigger it when a row is selected.
    
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    
    // If user is pasting into a specific input, let the browser handle it
    // unless it's a specific "bulk paste" trigger.
    // For now, we only intercept if text is tab-separated (Excel format)
    const text = e.clipboardData.getData('text/plain');
    if (!text || !text.includes('\t')) return;

    const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
    const parsedLines: T[] = [];

    for (const row of rows) {
      const columns = row.split('\t');
      const mapped = options.mapRow(columns, options.items);
      if (mapped) {
        parsedLines.push(mapped);
      }
    }

    if (parsedLines.length > 0) {
      // Prevent default to avoid pasting the raw text into a single input
      e.preventDefault();
      options.onPaste(parsedLines);
    }
  }, [options]);

  return { handlePaste };
}
