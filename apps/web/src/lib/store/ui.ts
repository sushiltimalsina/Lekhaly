// apps/web/src/lib/store/ui.ts

type UiState = {
  sidebarOpen: boolean;
};

type Listener = (state: UiState) => void;

let state: UiState = {
  sidebarOpen: false,
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getUiState() {
  return state;
}

export function setSidebarOpen(open: boolean) {
  state = { ...state, sidebarOpen: open };
  emit();
}

export function toggleSidebar() {
  setSidebarOpen(!state.sidebarOpen);
}

export function subscribeUi(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
