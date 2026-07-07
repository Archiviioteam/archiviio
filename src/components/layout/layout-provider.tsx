"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CommandPalette } from "@/components/search/command-palette";
import { mediaQueries } from "@/lib/layout/responsive";
import { writeSidebarOpen } from "@/lib/layout/sidebar-storage";

type LayoutContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pageTitleOverride: string | null;
  setPageTitleOverride: (title: string | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState(true);
  const [pageTitleOverride, setPageTitleOverride] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
    writeSidebarOpen(open);
  }, []);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(mediaQueries.persistentSidebar);

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setSidebarOpenState(true);
        return;
      }

      setSidebarOpenState(false);
    }

    mq.addEventListener("change", handleViewportChange);
    return () => mq.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isKKey = event.code === "KeyK" || event.key.toLowerCase() === "k";
      if (!isKKey) {
        return;
      }

      if (!event.metaKey && !event.ctrlKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setCommandPaletteOpen((current) => !current);
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      pageTitleOverride,
      setPageTitleOverride,
      commandPaletteOpen,
      setCommandPaletteOpen,
      openCommandPalette,
    }),
    [
      sidebarOpen,
      setSidebarOpen,
      pageTitleOverride,
      commandPaletteOpen,
      openCommandPalette,
    ]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

export function usePageTitleOverride(title: string | null | undefined) {
  const { setPageTitleOverride } = useLayout();

  useEffect(() => {
    setPageTitleOverride(title ?? null);
    return () => setPageTitleOverride(null);
  }, [title, setPageTitleOverride]);
}
