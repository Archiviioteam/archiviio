import { cn } from "@/lib/utils";

/** Gap between dashboard panels — single spacing source. */
export const dashboardGridGapClass = "gap-3";

/**
 * Fixed 2×2 dashboard grid.
 * Explicit 1fr tracks keep all four cells equal size; minmax(0, …) prevents overflow blowout.
 */
export const dashboardGridClass = cn(
  "grid h-full min-h-0 w-full",
  dashboardGridGapClass,
  "grid-cols-2 grid-rows-2",
  "[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]",
  "[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]"
);

/** Every grid cell must fill its track and clip overflow. */
export const dashboardPanelClass = "h-full min-h-0 min-w-0 overflow-hidden";

/** Shared inset padding for every panel header and body. */
export const dashboardPanelInsetClass = "p-3 sm:p-4 lg:p-6";

export const dashboardPanelHeaderClass = cn(
  "flex shrink-0 flex-row items-center justify-between gap-2 sm:gap-3",
  dashboardPanelInsetClass,
  "min-h-12 pb-0 sm:min-h-14"
);

export const dashboardPanelContentClass = cn(
  "flex min-h-0 flex-1 flex-col overflow-hidden",
  dashboardPanelInsetClass,
  "pt-3"
);

/** Gap between items inside a panel (lists, action tiles). */
export const dashboardPanelInnerGapClass = "gap-2";
