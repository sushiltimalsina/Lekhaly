import { logoutOnClose } from "@/lib/api/auth";
import { getToken } from "@/lib/store/auth";

type TabPresence = {
  updatedAt: number;
  state: "active" | "closing";
};

const TAB_PRESENCE_KEY = "lekhaly.auth.active-tabs";
const TAB_PRESENCE_HEARTBEAT_MS = 15_000;
const TAB_PRESENCE_TTL_MS = 120_000;

function createTabId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readTabPresence(): Record<string, TabPresence> {
  try {
    const value = localStorage.getItem(TAB_PRESENCE_KEY);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, TabPresence> : {};
  } catch {
    return {};
  }
}

function writeTabPresence(tabId: string, state: TabPresence["state"]) {
  const now = Date.now();
  const presence = readTabPresence();
  for (const [id, tab] of Object.entries(presence)) {
    if (!tab || now - tab.updatedAt > TAB_PRESENCE_TTL_MS) delete presence[id];
  }
  presence[tabId] = { updatedAt: now, state };
  try {
    localStorage.setItem(TAB_PRESENCE_KEY, JSON.stringify(presence));
  } catch {
    // Session cleanup still runs if browser storage is unavailable.
  }
}

function removeTabPresence(tabId: string) {
  const presence = readTabPresence();
  delete presence[tabId];
  try {
    localStorage.setItem(TAB_PRESENCE_KEY, JSON.stringify(presence));
  } catch {
    // Ignore storage failures during teardown.
  }
}

export function startBrowserSessionLifecycle() {
  if (typeof window === "undefined" || !getToken()) return () => {};

  const tabId = createTabId();
  writeTabPresence(tabId, "active");
  const heartbeat = window.setInterval(
    () => writeTabPresence(tabId, "active"),
    TAB_PRESENCE_HEARTBEAT_MS,
  );

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted) return;

    window.clearInterval(heartbeat);
    writeTabPresence(tabId, "closing");
    const now = Date.now();
    const otherActiveTabsRemain = Object.entries(readTabPresence()).some(
      ([id, tab]) => id !== tabId && tab.state === "active" && now - tab.updatedAt <= TAB_PRESENCE_TTL_MS,
    );
    if (!otherActiveTabsRemain) logoutOnClose();
  };

  const handlePageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    writeTabPresence(tabId, "active");
  };

  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
  return () => {
    window.clearInterval(heartbeat);
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("pageshow", handlePageShow);
    removeTabPresence(tabId);
  };
}
