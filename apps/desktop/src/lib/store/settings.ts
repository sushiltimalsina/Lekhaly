"use client";

export type CalendarPreference = "BS" | "AD";
export type DefaultDateRange = "today" | "this_week" | "this_month" | "this_quarter" | "this_year";
export type PrintLayout = "a4" | "a5" | "thermal";
export type Language = "en" | "ne";

type SettingsState = {
  calendarPreference: CalendarPreference;
  defaultDateRange: DefaultDateRange;
  printLayout: PrintLayout;
  language: Language;
  notifications: {
    lowStock: boolean;
    overdueInvoices: boolean;
  };
};

const STORAGE_KEY = "lekhaly.settings";
const DEFAULT_STATE: SettingsState = {
  calendarPreference: "BS",
  defaultDateRange: "this_month",
  printLayout: "a4",
  language: "en",
  notifications: {
    lowStock: true,
    overdueInvoices: true,
  },
};

let state: SettingsState = DEFAULT_STATE;
let initialized = false;
const listeners = new Set<(next: SettingsState) => void>();

function readFromStorage() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      state = { ...state, ...parsed };
    } catch (e) {
      // Fallback
    }
  }
}

function notify() {
  listeners.forEach((listener) => listener(state));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function getSettings(): SettingsState {
  if (!initialized) {
    initialized = true;
    readFromStorage();
  }
  return state;
}

export function setCalendarPreference(next: CalendarPreference) {
  state = { ...state, calendarPreference: next };
  notify();
}

export function setDefaultDateRange(next: DefaultDateRange) {
  state = { ...state, defaultDateRange: next };
  notify();
}

export function setPrintLayout(next: PrintLayout) {
  state = { ...state, printLayout: next };
  notify();
}

export function setLanguage(next: Language) {
  state = { ...state, language: next };
  notify();
}

export function setNotifications(next: Partial<SettingsState["notifications"]>) {
  state = {
    ...state,
    notifications: { ...state.notifications, ...next },
  };
  notify();
}

export function subscribeSettings(listener: (next: SettingsState) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
