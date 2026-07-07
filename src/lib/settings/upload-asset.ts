import type { SupabaseClient } from "@supabase/supabase-js";

export const WORKSPACE_ASSETS_BUCKET = "workspace-assets";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadAssetResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

function getExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeMap[file.type] ?? "jpg";
}

export function validateImageFile(file: File): UploadAssetResult | { ok: true } {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Use a JPG, PNG, WebP, or GIF image" };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller" };
  }

  return { ok: true };
}

export async function uploadWorkspaceAsset(
  supabase: SupabaseClient,
  workspaceId: string,
  storagePath: string,
  file: File
): Promise<UploadAssetResult> {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    return validation;
  }

  const { error } = await supabase.storage
    .from(WORKSPACE_ASSETS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, path: storagePath };
}

export async function removeWorkspaceAsset(
  supabase: SupabaseClient,
  storagePath: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.storage
    .from(WORKSPACE_ASSETS_BUCKET)
    .remove([storagePath]);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getAssetSignedUrl(
  supabase: SupabaseClient,
  storagePath: string | null
): Promise<string | null> {
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(WORKSPACE_ASSETS_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export function buildAvatarPath(
  workspaceId: string,
  userId: string,
  file: File
): string {
  return `${workspaceId}/avatars/${userId}.${getExtension(file)}`;
}

export function buildLogoPath(
  workspaceId: string,
  file: File
): string {
  return `${workspaceId}/logo.${getExtension(file)}`;
}
