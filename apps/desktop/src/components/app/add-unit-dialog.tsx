import * as React from "react";
import { Input } from "@lekhaly/ui";
import { createUnit } from "@/lib/api/units";
import { X, Save, Scale } from "lucide-react";
import { createPortal } from "react-dom";

type AddUnitDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (unit: any) => void;
};

export default function AddUnitDialog({ open, onClose, onSuccess }: AddUnitDialogProps) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createUnit({ name: name.trim() });
      onSuccess(res);
      onClose();
      setName("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create unit");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 dark:bg-orange-950/30">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Add New Unit</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{error}</div>}
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold text-slate-500 ml-1">UNIT NAME (e.g. PCS, KG, BOX)</span>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter unit name"
              className="h-11 rounded-2xl"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-6 rounded-xl text-xs font-bold border hover:bg-slate-50 transition-all font-mono"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-none transition-all flex items-center gap-2 font-mono"
            >
              <Save className="h-4 w-4" />
              {saving ? "SAVING..." : "SAVE UNIT"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
