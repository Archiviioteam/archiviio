/**
 * Archiviio responsive layout.
 *
 * Targets:
 * - iPhone / phone (< 768px): bottom tab bar, stacked single-column layouts
 * - iPad portrait (768–1023px): overlay drawer sidebar
 * - Mac / Windows desktop (≥ 1024px): persistent collapsible sidebar
 */

export const breakpoints = {
  /** iPhone and narrow phones */
  mobile: 768,
  /** iPad portrait and narrow viewports */
  tablet: 768,
  /** iPad landscape, Mac, and Windows desktop */
  desktop: 1024,
  /** Wide desktop with multi-column dashboard */
  wide: 1280,
} as const;

export const mediaQueries = {
  mobilePhone: `(max-width: ${breakpoints.mobile - 1}px)`,
  tabletOnly: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  overlaySidebar: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
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

/** Reusable layout class groups (Tailwind md = 768px, lg = 1024px) */
export const responsive = {
  contentShell: "mx-auto w-full max-w-6xl",
  contentPaddingX: "px-4 sm:px-6 lg:px-8",
  contentPaddingY: "py-4 sm:py-6 lg:py-8",
  contentPadding: "p-4 sm:p-6 lg:p-8",
  contentSafeAreaBottom:
    "pb-[max(var(--spacing-6),env(safe-area-inset-bottom))]",
  /** Extra bottom inset for the fixed mobile tab bar (phones only). */
  mobileBottomNavInset:
    "max-md:pb-[calc(5.4rem+env(safe-area-inset-bottom))] md:pb-[max(var(--spacing-6),env(safe-area-inset-bottom))]",
  pageHeader:
    "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center",
  overlayOnly: "lg:hidden",
  desktopOnly: "hidden lg:inline",
  mobileOnly: "lg:hidden",
  phoneOnly: "md:hidden",
  tabletDrawerOnly: "hidden md:block lg:hidden",
} as const;
