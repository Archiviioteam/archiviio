import type { DocumentFileTypeFilter } from "@/lib/documents/document-file-types";
import { documentMatchesFileTypes } from "@/lib/documents/document-file-types";
import type { Document } from "@/types/database";

export const SUGGESTED_DOCUMENT_TAGS = [
  "executive",
  "construction",
  "lighting",
  "renders",
  "client",
] as const;

export type SuggestedDocumentTag = (typeof SUGGESTED_DOCUMENT_TAGS)[number];

export function normalizeDocumentTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function normalizeDocumentTags(tags: string[]): string[] {
  const normalized = tags
    .map(normalizeDocumentTag)
    .filter((tag) => tag.length > 0);

  return [...new Set(normalized)];
}

export function collectDocumentTags(documents: Document[]): string[] {
  const tags = new Set<string>(SUGGESTED_DOCUMENT_TAGS);

  for (const document of documents) {
    for (const tag of document.tags) {
      tags.add(normalizeDocumentTag(tag));
    }
  }

  return [...tags].sort();
}

export function filterDocuments(
  documents: Document[],
  options: {
    search?: string;
    tags?: string[];
    fileTypes?: DocumentFileTypeFilter[];
  }
): Document[] {
  const query = options.search?.trim().toLowerCase() ?? "";
  const selectedTags = normalizeDocumentTags(options.tags ?? []);
  const selectedFileTypes = options.fileTypes ?? [];

  return documents.filter((document) => {
    const matchesSearch =
      query.length === 0 ||
      [
        document.name,
        document.file_type ?? "",
        ...document.tags,
      ].some((field) => field.toLowerCase().includes(query));

    const documentTags = normalizeDocumentTags(document.tags);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => documentTags.includes(tag));

    const matchesFileType = documentMatchesFileTypes(
      document.file_type,
      selectedFileTypes
    );

    return matchesSearch && matchesTags && matchesFileType;
  });
}
