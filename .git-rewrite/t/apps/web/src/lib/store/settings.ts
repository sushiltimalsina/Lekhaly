"use client";

export type CalendarPreference = "BS" | "AD";

type SettingsState = {
  calendarPreference: CalendarPreference;
};

const STORAGE_KEY = "lekhaly.calendarPreference";
const DEFAULT_STATE: SettingsState = { calendarPreference: "BS" };

let state: SettingsState = DEFAULT_STATE;
let initialized = false;
const listeners = new Set<(next: SettingsState) => void>();

function readFromStorage() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "BS" || stored === "AD") {
    state = { ...state, calendarPreference: stored };
  }
}

function notify() {
  listeners.forEach((listener) => listener(state));
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
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  notify();
}

export function subscribeSettings(listener: (next: SettingsState) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
