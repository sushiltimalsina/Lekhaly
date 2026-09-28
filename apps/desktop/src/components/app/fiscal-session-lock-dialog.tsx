import * as React from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@lekhaly/ui";
import { LockKeyhole, X } from "lucide-react";

type FiscalSessionLockCredentials = {
  reason: string;
  password?: string;
  totpCode?: string;
};

type FiscalSessionLockDialogProps = {
  open: boolean;
  sessionName: string;
  lock: boolean;
  onClose: () => void;
  onSubmit: (credentials: FiscalSessionLockCredentials) => Promise<void>;
};

export default function FiscalSessionLockDialog({ open, sessionName, lock, onClose, onSubmit }: FiscalSessionLockDialogProps) {
  const [reason, setReason] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [confirmLock, setConfirmLock] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setPassword("");
      setTotpCode("");
      setConfirmLock(false);
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock && !confirmLock) {
      setError("Please confirm that you want to lock this fiscal year before continuing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ reason: reason.trim(), ...(!lock ? { password, totpCode: totpCode.trim() || undefined } : {}) });
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message ?? `Failed to ${lock ? "lock" : "unlock"} fiscal year`);
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[11000] grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-accent/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-semibold">{lock ? "Lock fiscal year" : "Unlock fiscal year"}</h2>
              <p className="text-xs text-muted-foreground">{sessionName}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X className="h-4 w-4" /></Button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && <div role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {lock && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">Warning</p>
              <p className="mt-1 text-xs leading-5">
                Locking this fiscal year will prevent further posting and editing in this accounting period. Please confirm before continuing.
              </p>
            </div>
          )}

          <label className="block space-y-2 text-sm font-medium">
            Reason
            <Input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={lock ? "e.g. Period closed" : "e.g. Correcting a prior-period entry"} />
          </label>
          {!lock && <>
            <label className="block space-y-2 text-sm font-medium">
              Password
              <Input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Authenticator code <span className="text-xs font-normal text-muted-foreground">(required if TOTP is enabled)</span>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))} />
            </label>
          </>}
          {lock && (
            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <input
                type="checkbox"
                checked={confirmLock}
                onChange={(event) => setConfirmLock(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-amber-600"
              />
              <span>I understand that locking this fiscal year will restrict further changes in this period.</span>
            </label>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || (lock && !confirmLock)}>{busy ? "Saving..." : lock ? "Lock Year" : "Unlock Year"}</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
