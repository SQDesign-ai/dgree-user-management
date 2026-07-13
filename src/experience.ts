// -------------------------------------------------------------------------
// Experience mode — which information architecture the prototype renders.
//
//   "single" → one Access-management page with 3 tabs
//              (Accounts · SailADV · All yachts)
//   "split"  → two pages: Access management (Accounts + SailADV) and a
//              separate D.gree fleet page (All yachts)
//
// Chosen on the /experience page and saved in localStorage so it survives
// reloads; switchable any time from the sidebar.
// -------------------------------------------------------------------------
import { useSyncExternalStore } from "react";

export type Experience = "single" | "split";

const KEY = "dgree.experience";

function read(): Experience | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "single" || v === "split" ? v : null;
  } catch {
    return null;
  }
}

let current: Experience | null = read();
const listeners = new Set<() => void>();

export function getExperience(): Experience | null {
  return current;
}

export function setExperience(e: Experience | null) {
  current = e;
  try {
    if (e) localStorage.setItem(KEY, e);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — stay in-memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Subscribe a component to the current experience mode. */
export function useExperience(): Experience | null {
  return useSyncExternalStore(subscribe, getExperience, getExperience);
}
