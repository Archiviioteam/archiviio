import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Shared display size for project status and task urgency pills. */
export const statusPillBadgeSize = "sm" as const;

/** Display pills on cards and lists (project status, task urgency). */
export const statusPillBadgeClass = cn(
  textStyle.captionMedium,
  "leading-none"
);

/** Selectable pills in create/edit forms. */
export const statusPillSelectorClass = cn(
  radius.pill,
  "px-2.5 py-px leading-none",
  textStyle.captionMedium,
  transition.hover
);
