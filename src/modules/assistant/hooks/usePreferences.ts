import { useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

function mediaStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const reduced = mediaStore("(prefers-reduced-motion: reduce)");
const wide = mediaStore("(min-width: 1280px)");

export function useReducedMotion(): boolean {
  return useSyncExternalStore(reduced.subscribe, reduced.get, () => false);
}

export function useIsWide(): boolean {
  return useSyncExternalStore(wide.subscribe, wide.get, () => true);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);
}

export type PageStateOverride = "loading" | "empty" | "error" | null;

/** Dev-only `?state=loading|empty|error` override (definition of done, section K). */
export function usePageStateOverride(): PageStateOverride {
  const { search } = useLocation();
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(search).get("state");
  return v === "loading" || v === "empty" || v === "error" ? v : null;
}
