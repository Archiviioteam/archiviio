import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import { downloadDocumentToSystem } from "@/lib/documents/download-document-system";
import { normalizeDocumentTags } from "@/lib/documents/document-tags";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { isTauri } from "@/lib/tauri/env";
import type { Document } from "@/types/database";

const SIGNED_URL_TTL_SECONDS = 300;

type ActionResult = { ok: true } | { ok: false; error: string };

type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string };

export async function getDocumentSignedUrl(
  supabase: SupabaseClient,
  fileUrl: string,
  options?: { download?: string }
): Promise<SignedUrlResult> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(
      fileUrl,
      SIGNED_URL_TTL_SECONDS,
      options?.download ? { download: options.download } : undefined
    );

  if (error || !data?.signedUrl) {
    return {
      ok: false,
      error: error?.message ?? "Failed to generate file URL",
    };
  }

  return { ok: true, url: data.signedUrl };
}

export async function downloadDocument(
  supabase: SupabaseClient,
  document: Document
): Promise<ActionResult> {
  const result = await getDocumentSignedUrl(supabase, document.file_url, {
    download: document.name,
  });

  if (!result.ok) {
    return result;
  }

  if (isTauri()) {
    const saved = await downloadDocumentToSystem(result.url, document.name);
    if (!saved.ok) {
      return { ok: false, error: saved.error };
    }
    return { ok: true };
  }

  const anchor = window.document.createElement("a");
  anchor.href = result.url;
  anchor.download = document.name;
  anchor.rel = "noopener noreferrer";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  return { ok: true };
}

export async function deleteDocument(
  supabase: SupabaseClient,
  document: Document
): Promise<ActionResult> {
  const { data: versions, error: versionsError } = await supabase
    .from("document_versions")
    .select("file_url")
    .eq("document_id", document.id);

  if (versionsError) {
    return { ok: false, error: versionsError.message };
  }

  const storagePaths = [
    ...new Set([
      document.file_url,
      ...(versions?.map((version) => version.file_url) ?? []),
    ]),
  ];

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove(storagePaths);

  if (storageError) {
    return { ok: false, error: storageError.message };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  void logActivity(supabase, {
    workspaceId: document.workspace_id,
    action: "document.deleted",
    entityType: "document",
    entityId: document.id,
    projectId: document.project_id,
    title: document.name,
  });

  return { ok: true };
}

export async function updateDocumentTags(
  supabase: SupabaseClient,
  documentId: string,
  tags: string[]
): Promise<{ ok: true; document: Document } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("documents")
    .update({ tags: normalizeDocumentTags(tags) })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update tags",
    };
  }

  const updated = data as Document;

  void logActivity(supabase, {
    workspaceId: updated.workspace_id,
    action: "document.tags_updated",
    entityType: "document",
    entityId: updated.id,
    projectId: updated.project_id,
    title: updated.name,
    metadata: { tags: updated.tags },
  });

  return { ok: true, document: updated };
}
