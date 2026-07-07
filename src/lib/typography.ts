export const fontFamily =
  '"Helvetica Neue", Helvetica, Arial, sans-serif' as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  bold: 700,
} as const;

export const textStyle = {
  display: "text-display font-bold",
  pageTitle: "text-title font-bold",
  sectionTitle: "text-heading font-medium",
  body: "text-body font-normal",
  bodyMedium: "text-body font-medium",
  bodyLarge: "text-body-lg font-normal",
  caption: "text-caption font-normal",
  captionMedium: "text-caption font-medium",
  brand: "text-body-lg font-bold",
  nav: "text-body font-medium",
  truncate: "truncate leading-normal",
} as const;

export type TextStyle = keyof typeof textStyle;
