import { cn } from "@/lib/utils";

/** Gap between dashboard panels — single spacing source. */
export const dashboardGridGapClass = "gap-3";

/** Mobile / tablet: vertical stack. CSS in globals.css enforces this below lg. */
export const dashboardGridClassMobile = cn(
  "dashboard-grid-mobile",
  "flex w-full flex-col",
  dashboardGridGapClass
);

/** Desktop only: fixed 2×2 grid (unchanged from original). */
export const dashboardGridClassDesktop = cn(
  "dashboard-grid-desktop",
  "grid h-full min-h-0 w-full",
  dashboardGridGapClass,
  "grid-cols-2 grid-rows-2",
  "[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]",
  "[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]"
);

/** @deprecated Use dashboardGridClassMobile / dashboardGridClassDesktop */
export const dashboardGridClass = dashboardGridClassDesktop;

/** Panel on mobile: natural height, full width. */
export const dashboardPanelClassMobile = cn(
  "dashboard-panel-mobile",
  "min-h-0 min-w-0 w-full shrink-0 overflow-hidden"
);

/** Panel on desktop: fill grid cell. */
export const dashboardPanelClassDesktop = "h-full min-h-0 min-w-0 overflow-hidden";

/** @deprecated Use dashboardPanelClassMobile / dashboardPanelClassDesktop */
export const dashboardPanelClass = dashboardPanelClassDesktop;

/** Shared inset padding for every panel header and body. */
export const dashboardPanelInsetClass = "p-3 sm:p-4 lg:p-6";

export const dashboardPanelHeaderClass = cn(
  "flex shrink-0 flex-col items-stretch gap-2",
  "sm:flex-row sm:items-center sm:justify-between sm:gap-3",
  dashboardPanelInsetClass,
  "min-h-0 pb-0 sm:min-h-14"
);

export const dashboardPanelContentClass = cn(
  "flex min-h-0 flex-1 flex-col overflow-hidden",
  dashboardPanelInsetClass,
  "pt-3"
);

export const dashboardPanelCompactHeaderClass = cn(
  "flex shrink-0 flex-col items-stretch gap-1",
  "sm:flex-row sm:items-center sm:justify-between sm:gap-2",
  "p-3 pb-1",
  "min-h-0"
);

export const dashboardPanelCompactContentClass = cn(
  "flex min-h-0 flex-1 flex-col overflow-hidden",
  "p-3 pt-1.5"
);

/** List panels (projects, tasks): tight header-to-list spacing. */
export const dashboardPanelListContentClass = cn(
  dashboardPanelCompactContentClass,
  "justify-start"
);

export const projectOverviewGridGapClass = "gap-3";

/** Gap between items inside a panel (lists, action tiles). */
export const dashboardPanelInnerGapClass = "gap-2";
