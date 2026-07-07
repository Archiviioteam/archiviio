export const DOCUMENT_FILE_TYPE_FILTERS = [
  { id: "pdf", label: "PDF" },
  { id: "dwg", label: "DWG" },
  { id: "jpg", label: "JPG" },
  { id: "png", label: "PNG" },
  { id: "excel", label: "Excel" },
] as const;

export type DocumentFileTypeFilter =
  (typeof DOCUMENT_FILE_TYPE_FILTERS)[number]["id"];

const FILE_TYPE_ALIASES: Record<DocumentFileTypeFilter, readonly string[]> = {
  pdf: ["pdf"],
  dwg: ["dwg"],
  jpg: ["jpg", "jpeg"],
  png: ["png"],
  excel: ["xlsx", "xls"],
};

export function documentMatchesFileType(
  fileType: string | null,
  filter: DocumentFileTypeFilter
): boolean {
  if (!fileType) return false;
  const normalized = fileType.toLowerCase();
  return FILE_TYPE_ALIASES[filter].includes(normalized);
}

export function documentMatchesFileTypes(
  fileType: string | null,
  filters: DocumentFileTypeFilter[]
): boolean {
  if (filters.length === 0) return true;
  return filters.some((filter) => documentMatchesFileType(fileType, filter));
}
