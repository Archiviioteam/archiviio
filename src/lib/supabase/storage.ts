export const DOCUMENTS_BUCKET = "documents";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 50;

export const DOCUMENT_ALLOWED_EXTENSIONS = [
  "pdf",
  "dwg",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "docx",
  "xlsx",
  "zip",
] as const;

export type DocumentAllowedExtension = (typeof DOCUMENT_ALLOWED_EXTENSIONS)[number];

export const DWG_MIME_TYPES = [
  "image/vnd.dwg",
  "image/x-dwg",
  "application/acad",
  "application/x-dwg",
  "application/dwg",
  "application/x-autocad",
  "application/autocad_dwg",
  "application/vnd.autodesk.autocad.dwg",
  "application/octet-stream",
] as const;

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  ...DWG_MIME_TYPES,
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
] as const;

const EXTENSION_MIME_TYPES: Record<DocumentAllowedExtension, readonly string[]> = {
  pdf: ["application/pdf"],
  dwg: DWG_MIME_TYPES,
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ],
  zip: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
};

/** Client-side limit — must not exceed the bucket file_size_limit in 008_documents_storage_rules.sql */
export function getDocumentMaxFileSizeBytes(): number {
  const configuredMb = process.env.NEXT_PUBLIC_DOCUMENT_MAX_FILE_SIZE_MB;
  const parsedMb = configuredMb ? Number.parseInt(configuredMb, 10) : DEFAULT_MAX_FILE_SIZE_MB;

  if (!Number.isFinite(parsedMb) || parsedMb <= 0) {
    return DEFAULT_MAX_FILE_SIZE_MB * BYTES_PER_MB;
  }

  return parsedMb * BYTES_PER_MB;
}

export function getDocumentFileExtension(filename: string): string | null {
  const parts = filename.split(".");
  if (parts.length < 2) return null;

  const extension = parts.at(-1)?.trim().toLowerCase();
  return extension || null;
}

export function isAllowedDocumentExtension(
  extension: string
): extension is DocumentAllowedExtension {
  return (DOCUMENT_ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
}

export function isAllowedDocumentMimeType(mimeType: string): boolean {
  return (DOCUMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedDocumentFile(file: File): boolean {
  const extension = getDocumentFileExtension(file.name);
  if (!extension || !isAllowedDocumentExtension(extension)) {
    return false;
  }

  if (!file.type) {
    return true;
  }

  const allowedForExtension = EXTENSION_MIME_TYPES[extension];
  return allowedForExtension.includes(file.type);
}

export type DocumentFileValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateDocumentFile(file: File): DocumentFileValidationResult {
  const extension = getDocumentFileExtension(file.name);

  if (!extension || !isAllowedDocumentExtension(extension)) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed: ${DOCUMENT_ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  if (file.type && !EXTENSION_MIME_TYPES[extension].includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported MIME type for .${extension} files.`,
    };
  }

  const maxBytes = getDocumentMaxFileSizeBytes();
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / BYTES_PER_MB);
    return {
      ok: false,
      error: `File exceeds the ${maxMb} MB size limit.`,
    };
  }

  return { ok: true };
}

/** Storage object path: {workspace_id}/{project_id|_studio}/{document_id}/{filename} */
export function buildDocumentStoragePath(
  workspaceId: string,
  projectId: string | null,
  documentId: string,
  filename: string
): string {
  const scope = projectId ?? "_studio";
  return `${workspaceId}/${scope}/${documentId}/${filename}`;
}
