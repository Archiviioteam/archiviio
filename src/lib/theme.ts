/**
 * Archiviio theme tokens.
 *
 * Palette avoids pure black and pure white.
 * Surfaces use soft neutrals; dark mode leans on borders over heavy shadows.
 */

import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export {
  radius,
  radiusPx,
  radiusClipShellClass,
  radiusClipSurfaceClass,
  radiusTierProps,
  childRadiusTier,
  radiusClassForTier,
  desktopInnerPanelClass,
  desktopColumnWrapperClass,
  desktopMacosChromeTopClass,
  desktopSidebarInsetClass,
  desktopContentInsetClass,
  desktopShellInsetClass,
  desktopSidebarPanelClass,
  appShellRootClass,
  type RadiusTier,
} from "@/lib/radius";

export const elevation = {
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
} as const;

export const overlay = "bg-overlay";

export function sidebarNavItemClass(isActive: boolean): string {
  return cn(
    "flex w-full items-center gap-3 px-3 py-2",
    radius.control,
    textStyle.nav,
    transition.hover,
    isActive
      ? "bg-sidebar-accent/45 text-sidebar-foreground hover:bg-sidebar-accent/55"
      : "text-muted-foreground hover:bg-sidebar-accent/25 hover:text-sidebar-foreground"
  );
}
