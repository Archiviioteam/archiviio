export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import { formatDate } from "@/lib/date-format";

export function formatUploadDate(iso: string): string {
  return formatDate(iso);
}

export function getFileTypeLabel(fileType: string | null): string {
  if (!fileType) return "File";
  return fileType.toUpperCase();
}

export function isPdfDocument(fileType: string | null): boolean {
  return fileType?.toLowerCase() === "pdf";
}

export function isImageDocument(fileType: string | null): boolean {
  if (!fileType) return false;
  return ["jpg", "jpeg", "png", "webp"].includes(fileType.toLowerCase());
}

export function supportsInlinePdfPreview(fileType: string | null): boolean {
  return isPdfDocument(fileType);
}

export function supportsImagePreviewModal(fileType: string | null): boolean {
  return isImageDocument(fileType);
}

export function isDownloadOnlyDocument(fileType: string | null): boolean {
  return !supportsInlinePdfPreview(fileType) && !supportsImagePreviewModal(fileType);
}
