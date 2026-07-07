/**
 * Archiviio spacing system.
 *
 * Allowed values (px): 4, 8, 12, 16, 24, 32, 48, 64
 * Tailwind tokens: 1, 2, 3, 4, 6, 8, 12, 16
 */

export const spacingPx = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export type SpacingToken = keyof typeof spacingPx;

/** Vertical stacks */
export const stack = {
  tight: "gap-1",
  compact: "gap-2",
  default: "gap-4",
  relaxed: "gap-6",
  loose: "gap-8",
} as const;

/** Uniform padding */
export const inset = {
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
} as const;

/** Common control heights from the spacing scale */
export const controlHeight = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
  bar: "h-16",
} as const;

/**
 * Layout tokens (defined in globals.css, composed from spacing scale).
 * w-sidebar · min-h-editor · max-h-list · h-pdf-viewer
 */
export const layout = {
  sidebar: "w-sidebar",
  editorMinHeight: "min-h-editor",
  listMaxHeight: "max-h-list",
  pdfViewerHeight: "h-pdf-viewer",
} as const;
