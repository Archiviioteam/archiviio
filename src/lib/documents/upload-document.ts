import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  buildDocumentStoragePath,
  DOCUMENTS_BUCKET,
  getDocumentFileExtension,
  validateDocumentFile,
} from "@/lib/supabase/storage";
import type { Document } from "@/types/database";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  dwg: "image/vnd.dwg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

export type UploadDocumentOptions = {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export type UploadDocumentResult =
  | { ok: true; document: Document }
  | { ok: false; error: string };

function encodeStoragePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function getDocumentContentType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const extension = getDocumentFileExtension(file.name);
  if (extension && CONTENT_TYPE_BY_EXTENSION[extension]) {
    return CONTENT_TYPE_BY_EXTENSION[extension];
  }

  return "application/octet-stream";
}

async function uploadFileWithProgress(
  supabase: SupabaseClient,
  storagePath: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "Not authenticated" };
  }

  const { url, anonKey } = getSupabaseEnv();
  const endpoint = `${url}/storage/v1/object/${DOCUMENTS_BUCKET}/${encodeStoragePath(storagePath)}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ error: null });
        return;
      }

      let message = "Upload failed";
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message ?? body.error ?? message;
      } catch {
        if (xhr.responseText) {
          message = xhr.responseText;
        }
      }

      resolve({ error: message });
    });

    xhr.addEventListener("error", () => {
      resolve({ error: "Network error during upload" });
    });

    xhr.addEventListener("abort", () => {
      resolve({ error: "Upload cancelled" });
    });

    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", getDocumentContentType(file));
    xhr.send(file);
  });
}

export async function uploadDocument(
  options: UploadDocumentOptions
): Promise<UploadDocumentResult> {
  const { supabase, workspaceId, projectId, file, onProgress } = options;

  const validation = validateDocumentFile(file);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const documentId = crypto.randomUUID();
  const storagePath = buildDocumentStoragePath(
    workspaceId,
    projectId,
    documentId,
    file.name
  );
  const fileType = getDocumentFileExtension(file.name);

  onProgress?.(0);

  const { error: uploadError } = await uploadFileWithProgress(
    supabase,
    storagePath,
    file,
    onProgress
  );

  if (uploadError) {
    return { ok: false, error: uploadError };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      workspace_id: workspaceId,
      project_id: projectId,
      name: file.name,
      file_url: storagePath,
      file_type: fileType,
      file_size: file.size,
      uploaded_by: user.id,
      tags: [],
    })
    .select("*")
    .single();

  if (documentError || !document) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return {
      ok: false,
      error: documentError?.message ?? "Failed to save document record",
    };
  }

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: documentId,
    version_number: 1,
    file_url: storagePath,
  });

  if (versionError) {
    await supabase.from("documents").delete().eq("id", documentId);
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { ok: false, error: versionError.message };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "document.uploaded",
    entityType: "document",
    entityId: documentId,
    projectId,
    title: file.name,
  });

  return { ok: true, document: document as Document };
}
