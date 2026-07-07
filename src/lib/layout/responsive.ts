/**
 * Archiviio responsive layout.
 *
 * Targets:
 * - Mac / Windows desktop (≥ 1024px): persistent collapsible sidebar
 * - iPad landscape (≥ 1024px): persistent collapsible sidebar
 * - iPad portrait (< 1024px): overlay drawer sidebar
 */

export const breakpoints = {
  /** iPad portrait and narrow viewports */
  tablet: 768,
  /** iPad landscape, Mac, and Windows desktop */
  desktop: 1024,
  /** Wide desktop with multi-column dashboard */
  wide: 1280,
} as const;

export const mediaQueries = {
  overlaySidebar: `(max-width: ${breakpoints.desktop - 1}px)`,
  persistentSidebar: `(min-width: ${breakpoints.desktop}px)`,
} as const;

export function isOverlaySidebarViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(mediaQueries.overlaySidebar).matches;
}

export function isPersistentSidebarViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(mediaQueries.persistentSidebar).matches;
}

/** Reusable layout class groups (Tailwind lg = 1024px) */
export const responsive = {
  contentShell: "mx-auto w-full max-w-6xl",
  contentPaddingX: "px-4 sm:px-6 lg:px-8",
  contentPaddingY: "py-4 sm:py-6 lg:py-8",
  contentPadding: "p-4 sm:p-6 lg:p-8",
  contentSafeAreaBottom:
    "pb-[max(var(--spacing-6),env(safe-area-inset-bottom))]",
  pageHeader:
    "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center",
  overlayOnly: "lg:hidden",
  desktopOnly: "hidden lg:inline",
  mobileOnly: "lg:hidden",
} as const;
