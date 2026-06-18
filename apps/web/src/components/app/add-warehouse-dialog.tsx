"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Input } from "@lekhaly/ui";
import { Save, Warehouse, X } from "lucide-react";
import { createBin, createWarehouse, type Warehouse as WarehouseRecord, type WarehouseBin } from "@/lib/api/warehouses";

type AddWarehouseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (record: WarehouseRecord | WarehouseBin) => void;
  warehouseId?: string;
  warehouseName?: string;
};

export default function AddWarehouseDialog({ open, onClose, onSuccess, warehouseId, warehouseName }: AddWarehouseDialogProps) {
  const isBin = Boolean(warehouseId);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setName("");
      setCode("");
      setError(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(isBin ? "Bin name is required" : "Warehouse name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), code: code.trim() || undefined };
      const record = isBin ? await createBin(warehouseId!, payload) : await createWarehouse(payload);
      onSuccess(record);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? `Failed to create ${isBin ? "bin" : "warehouse"}`);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-accent/20 px-6 py-4 dark:bg-accent/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/30">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">{isBin ? "Add New Bin" : "Add New Warehouse"}</h3>
              {isBin && warehouseName ? <p className="text-xs text-muted-foreground">{warehouseName}</p> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30">{error}</div> : null}
          <label className="block space-y-1.5">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{isBin ? "Bin Name" : "Warehouse Name"}</span>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={isBin ? "e.g. Rack A1" : "e.g. Main Warehouse"} className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10" />
          </label>
          <label className="block space-y-1.5">
            <span className="ml-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Code</span>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={isBin ? "e.g. A1" : "e.g. MAIN"} className="h-11 rounded-2xl bg-accent/20 dark:bg-accent/10" />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-6 text-xs font-bold text-muted-foreground hover:bg-accent">CANCEL</button>
            <button type="submit" disabled={saving} className="flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-6 text-xs font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-700 disabled:opacity-70 dark:shadow-none">
              <Save className="h-4 w-4" /> {saving ? "SAVING..." : isBin ? "SAVE BIN" : "SAVE WAREHOUSE"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
