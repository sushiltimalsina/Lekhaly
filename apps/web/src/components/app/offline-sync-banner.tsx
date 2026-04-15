"use client";

import * as React from "react";
import { OFFLINE_SYNC_EVENT, getPendingOfflineRequestCount, syncPendingOfflineRequests } from "@/lib/api/client";

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const refreshPendingCount = async () => {
      const count = await getPendingOfflineRequestCount();
      if (active) setPendingCount(count);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      const result = await syncPendingOfflineRequests();
      if (!active) return;
      setPendingCount(result.pending);
      if (result.synced > 0) {
        const message = `${result.synced} offline draft${result.synced === 1 ? "" : "s"} synced with the server.`;
        setSyncMessage(message);
        window.setTimeout(() => {
          setSyncMessage((current) => (current === message ? null : current));
        }, 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSyncEvent = () => {
      void refreshPendingCount();
    };

    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    void refreshPendingCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void handleOnline();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OFFLINE_SYNC_EVENT, handleSyncEvent as EventListener);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OFFLINE_SYNC_EVENT, handleSyncEvent as EventListener);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Offline mode: voucher and invoice drafts are being saved to local storage. Go online to sync them with the server.
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {pendingCount} offline draft{pendingCount === 1 ? "" : "s"} waiting to sync with the server.
      </div>
    );
  }

  if (syncMessage) {
    return (
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {syncMessage}
      </div>
    );
  }

  return null;
}
