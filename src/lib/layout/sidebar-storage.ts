import { isPersistentSidebarViewport } from "@/lib/layout/responsive";

export const SIDEBAR_OPEN_STORAGE_KEY = "archiviio:sidebar-open";

export function readSidebarOpen(): boolean {
  if (typeof window === "undefined") return true;

  const stored = window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;

  return isPersistentSidebarViewport();
}

export function writeSidebarOpen(open: boolean): void {
  window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(open));
}
