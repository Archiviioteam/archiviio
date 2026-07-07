import { cn } from "@/lib/utils";

/**
 * Archiviio nested radius system — derived from the 24px desktop shell.
 *
 * Progressive visual hierarchy (Apple-style, soft & uniform):
 *
 * | Tier     | px  | Examples                          |
 * |----------|-----|-----------------------------------|
 * | shell    | 24  | Desktop window, app root          |
 * | surface  | 22  | Dashboard panels, sidebar, dialogs|
 * | nested   | 18  | Cards / rows inside panels        |
 * | control  | 14  | Buttons, inputs, selects          |
 * | pill     | ∞   | Badges, chips, status indicators  |
 *
 * Mark containers with `data-radius-tier`. Child controls inside
 * `surface` / `nested` tiers automatically receive `control` radius via CSS.
 * Pill tier is reserved for decorative / status micro-elements only.
 */
export type RadiusTier = "shell" | "surface" | "nested" | "control" | "pill";

export const radiusPx = {
  shell: 24,
  surface: 22,
  nested: 18,
  control: 14,
} as const;

const CHILD_TIER: Record<Exclude<RadiusTier, "pill" | "control">, RadiusTier> =
  {
    shell: "surface",
    surface: "nested",
    nested: "control",
  };

export const radius = {
  shell: "rounded-shell",
  surface: "rounded-surface",
  nested: "rounded-nested",
  control: "rounded-control",
  pill: "rounded-full",
  /** @deprecated Use `radius.nested` */
  inner: "rounded-nested",
  /** Alias for surface — legacy call sites. */
  default: "rounded-surface",
} as const;

/** Next radius tier for a nested child of `parent`. */
export function childRadiusTier(
  parent: Exclude<RadiusTier, "pill" | "control">
): RadiusTier {
  return CHILD_TIER[parent];
}

/** Tailwind class for a given tier. */
export function radiusClassForTier(tier: RadiusTier): string {
  return radius[tier === "pill" ? "pill" : tier];
}

/** `data-radius-tier` attribute for container elements. */
export function radiusTierProps(
  tier: Exclude<RadiusTier, "pill" | "control">
): { "data-radius-tier": typeof tier } {
  return { "data-radius-tier": tier };
}

/** Clip children to the shell radius. */
export const radiusClipShellClass = cn(radius.shell, "overflow-hidden");

/** Clip children to a surface radius. */
export const radiusClipSurfaceClass = cn(radius.surface, "overflow-hidden");

/**
 * Inner desktop panels — flat inside the 24px shell so only one
 * corner radius is visible (no outer/inner mismatch).
 */
export function desktopInnerPanelClass(isDesktop: boolean): string {
  return cn(
    "min-h-0 flex-1 overflow-hidden",
    isDesktop
      ? cn(radius.surface, radiusClipSurfaceClass, "bg-background")
      : "bg-background"
  );
}

type DesktopPlatform = "macos" | "windows" | "linux" | "unknown";

/** macOS overlay title bar — clears space for native traffic lights. */
export function desktopMacosChromeTopClass(
  isDesktop: boolean,
  platform: DesktopPlatform
): string {
  return isDesktop && platform === "macos"
    ? "lg:pt-[var(--inset-macos-chrome-top)]"
    : "";
}

/** Shared desktop shell inset — matches sidebar and main content padding. */
export const desktopShellInsetClass = "lg:p-3";

/** Inset padding around the desktop sidebar panel so it floats off the window edges. */
export function desktopSidebarInsetClass(isDesktop: boolean): string {
  return isDesktop ? desktopShellInsetClass : "max-lg:px-0 max-lg:pb-0 max-lg:pt-0";
}

/** Inset padding around the desktop main content column. */
export function desktopContentInsetClass(
  isDesktop: boolean,
  sidebarOpen: boolean
): string {
  if (!isDesktop) {
    return "";
  }

  return cn("lg:py-3 lg:pr-3", !sidebarOpen && "lg:pl-3");
}

/** Desktop sidebar panel with uniform surface radius. */
export function desktopSidebarPanelClass(isDesktop: boolean): string {
  return radius.surface;
}

/** Column wrapper inside the desktop shell. */
export function desktopColumnWrapperClass(
  isDesktop: boolean,
  sidebarOpen: boolean
): string {
  return cn(
    "flex min-w-0 flex-1 flex-col overflow-hidden",
    desktopContentInsetClass(isDesktop, sidebarOpen)
  );
}

/** App shell root — full viewport; web only. */
export function appShellRootClass(isDesktop: boolean): string {
  return cn(
    "flex h-[100dvh] min-h-screen bg-background",
    isDesktop ? radiusClipShellClass : "overflow-hidden"
  );
}

/** Tauri desktop root — 24px shell clip on the native window (edge-to-edge). */
export function desktopShellRootClass(
  isDesktop: boolean,
  _platform: DesktopPlatform = "unknown"
): string {
  return cn(
    "flex h-[100dvh] min-h-screen bg-background",
    isDesktop ? radiusClipShellClass : "overflow-hidden"
  );
}
