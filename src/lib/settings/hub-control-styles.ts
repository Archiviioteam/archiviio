import { radius } from "@/lib/theme";
import { dashboardPanelClassDesktop, dashboardPanelClassMobile } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";

/** Outer settings hub tiles — no border, no hover fill. */
export const settingsHubTileClass = cn(
  dashboardPanelClassMobile,
  dashboardPanelClassDesktop,
  radius.nested,
  "flex min-h-0 flex-col border-0 bg-card p-6 shadow-none transition-none hover:bg-card sm:p-8",
  "max-lg:min-h-0 lg:h-full"
);

/** Pill controls matching the search bar — perfect semicircle end caps. */
export const settingsHubPillShellClass = cn(
  radius.pill,
  "border border-input bg-card"
);

export const settingsHubPillFieldClass = cn(
  settingsHubPillShellClass,
  "h-12 px-4"
);

export const settingsHubPillButtonClass = cn(radius.pill, "h-12 px-4");

export const settingsHubSegmentedShellClass = cn(
  radius.pill,
  "relative grid h-12 w-full gap-0 border border-border/60 bg-muted/30 p-1"
);

export const settingsHubSegmentedIndicatorClass = cn(
  radius.pill,
  "pointer-events-none absolute inset-y-1 left-1 bg-card shadow-[var(--shadow-sm)]"
);
