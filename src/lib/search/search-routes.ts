import type { ProjectTabId } from "@/components/projects/project-tabs";

export function projectHref(
  projectId: string,
  tab?: ProjectTabId
): string {
  if (!tab) {
    return `/projects/${projectId}`;
  }

  return `/projects/${projectId}?tab=${tab}`;
}

export function contactHref(contactId: string): string {
  return `/contacts?id=${contactId}`;
}

export function supplierHref(supplierId: string): string {
  return `/suppliers?id=${supplierId}`;
}

export function documentHref(
  documentId: string,
  projectId: string | null
): string {
  if (projectId) {
    return projectHref(projectId, "documents");
  }

  return `/documents?id=${documentId}`;
}

export function tagHref(tag: string): string {
  return `/documents?tag=${encodeURIComponent(tag)}`;
}

export function nomenclatureHref(projectId: string): string {
  return projectHref(projectId);
}
