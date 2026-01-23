// apps/web/src/lib/store/ui.ts

type UiState = {
  sidebarOpen: boolean;
  density: "comfortable" | "compact";
};

type Listener = (state: UiState) => void;

let state: UiState = {
  sidebarOpen: false,
  density: "comfortable",
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getUiState() {
  return state;
}

const DENSITY_KEY = "lekhaly-density";

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

export function toggleSidebar() {
  setSidebarOpen(!state.sidebarOpen);
}

export function subscribeUi(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
