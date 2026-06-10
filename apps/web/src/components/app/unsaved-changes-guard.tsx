"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@lekhaly/ui";
import { AlertTriangle } from "lucide-react";

declare global {
  interface Window {
    lekhalyUnsavedChanges?: {
      requestNavigation: (onContinue: () => void) => boolean;
      markDirty: () => void;
      clear: () => void;
      isDirty: () => boolean;
    };
    lekhalySaveDraftBeforeLeave?: () => Promise<void> | void;
  }
}

function isGuardedRoute(pathname: string) {
  if (!pathname || pathname.startsWith("/reports/")) return false;
  const segments = pathname.split("/").filter(Boolean);
  return segments.some((segment) => ["create", "new", "edit", "view"].includes(segment));
}

function isFormTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-unsaved-ignore]")) return false;
  if (target.isContentEditable) return true;
  const element = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  if (!["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) return false;
  if (element instanceof HTMLInputElement && ["button", "submit", "reset", "hidden", "file"].includes(element.type)) return false;
  return true;
}

function findInternalAnchor(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
  if (!anchor) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  if (anchor.dataset.unsavedIgnore === "true" || anchor.closest("[data-unsaved-ignore]")) return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null;
  return url;
}

export default function UnsavedChangesGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const active = isGuardedRoute(pathname);
  const [dirty, setDirty] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<(() => void) | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);

  React.useEffect(() => {
    setDirty(false);
    setPendingAction(null);
  }, [pathname]);

  React.useEffect(() => {
    if (!active) return;

    const markDirty = (event: Event) => {
      if (isFormTarget(event.target)) setDirty(true);
    };

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
    };
  }, [active]);

  React.useEffect(() => {
    window.lekhalyUnsavedChanges = {
      requestNavigation: (onContinue) => {
        if (!active || !dirty) return true;
        setPendingAction(() => onContinue);
        return false;
      },
      markDirty: () => {
        if (active) setDirty(true);
      },
      clear: () => setDirty(false),
      isDirty: () => active && dirty
    };

    return () => {
      if (window.lekhalyUnsavedChanges?.isDirty() === (active && dirty)) {
        delete window.lekhalyUnsavedChanges;
      }
    };
  }, [active, dirty]);

  React.useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!active || !dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active, dirty]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!active || !dirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = findInternalAnchor(event.target);
      if (!url) return;
      event.preventDefault();
      setPendingAction(() => () => router.push(`${url.pathname}${url.search}${url.hash}`));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, dirty, router]);

  if (!pendingAction) return null;
  const canSaveDraft = typeof window !== "undefined" && typeof window.lekhalySaveDraftBeforeLeave === "function";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl" onClick={() => setPendingAction(null)} />
      <Card className="relative w-full max-w-md border-border bg-card shadow-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <h2 className="text-base font-bold text-foreground">Discard unsaved changes?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This page has changes that have not been saved. You can keep editing or discard the changes and leave this page.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setPendingAction(null)} disabled={savingDraft} className="rounded-xl">
                Keep Editing
              </Button>
              {canSaveDraft && (
                <Button
                  onClick={async () => {
                    const action = pendingAction;
                    setSavingDraft(true);
                    try {
                      await window.lekhalySaveDraftBeforeLeave?.();
                      setDirty(false);
                      setPendingAction(null);
                      window.setTimeout(action, 0);
                    } finally {
                      setSavingDraft(false);
                    }
                  }}
                  disabled={savingDraft}
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {savingDraft ? "Saving..." : "Save as Draft"}
                </Button>
              )}
            </div>
            <Button
              onClick={() => {
                const action = pendingAction;
                setDirty(false);
                setPendingAction(null);
                window.setTimeout(action, 0);
              }}
              disabled={savingDraft}
              className="mx-auto flex rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              Discard Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
