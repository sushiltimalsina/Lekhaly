// apps/web/src/lib/store/ui.ts

type UiState = {
  sidebarOpen: boolean;
  density: "comfortable" | "compact";
  currencyCode: "NPR" | "INR" | "USD";
  currencySymbol: "रु." | "NPR" | "Rs.";
  numberFormat: "en-IN" | "en-US";
};

type Listener = (state: UiState) => void;

let state: UiState = {
  sidebarOpen: false,
  density: "comfortable",
  currencyCode: "NPR",
  currencySymbol: "रु.",
  numberFormat: "en-IN",
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getUiState() {
  return state;
}

const DENSITY_KEY = "lekhaly-density";
const CURRENCY_KEY = "lekhaly-currency";
const FORMAT_KEY = "lekhaly-number-format";

function applyDensity(density: UiState["density"]) {
  if (typeof window === "undefined") return;
  document.documentElement.dataset.density = density;
  document.body.dataset.density = density;
}

if (typeof window !== "undefined") {
  const stored = localStorage.getItem(DENSITY_KEY) as UiState["density"] | null;
  if (stored === "compact" || stored === "comfortable") {
    state = { ...state, density: stored };
  }
  const storedCurrency = localStorage.getItem(CURRENCY_KEY) as UiState["currencySymbol"] | null;
  if (storedCurrency === "रु." || storedCurrency === "NPR" || storedCurrency === "Rs.") {
    state = { ...state, currencySymbol: storedCurrency };
  }
  const storedFormat = localStorage.getItem(FORMAT_KEY) as UiState["numberFormat"] | null;
  if (storedFormat === "en-IN" || storedFormat === "en-US") {
    state = { ...state, numberFormat: storedFormat };
  }
  applyDensity(state.density);
}

export function setSidebarOpen(open: boolean) {
  state = { ...state, sidebarOpen: open };
  emit();
}

export function setDensity(density: UiState["density"]) {
  state = { ...state, density };
  if (typeof window !== "undefined") {
    localStorage.setItem(DENSITY_KEY, density);
    applyDensity(density);
  }
  emit();
}

export function toggleDensity() {
  setDensity(state.density === "compact" ? "comfortable" : "compact");
}

export function getCurrencySettings() {
  return {
    currencyCode: state.currencyCode,
    currencySymbol: state.currencySymbol,
    numberFormat: state.numberFormat,
  };
}

export function setCurrencySymbol(symbol: UiState["currencySymbol"]) {
  state = { ...state, currencySymbol: symbol };
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENCY_KEY, symbol);
  }
  emit();
}

export function setNumberFormat(format: UiState["numberFormat"]) {
  state = { ...state, numberFormat: format };
  if (typeof window !== "undefined") {
    localStorage.setItem(FORMAT_KEY, format);
  }
  emit();
}

export function toggleSidebar() {
  setSidebarOpen(!state.sidebarOpen);
}

export function subscribeUi(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

