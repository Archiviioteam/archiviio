import type { SupabaseClient } from "@supabase/supabase-js";
import { DOCUMENTS_BUCKET } from "@/lib/supabase/storage";
import { WORKSPACE_ASSETS_BUCKET } from "@/lib/settings/upload-asset";

async function listAllStoragePaths(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = [];
  const queue = [prefix];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const { data, error } = await supabase.storage.from(bucket).list(current, {
      limit: 1000,
    });

    if (error || !data?.length) {
      continue;
    }

    for (const entry of data) {
      const entryPath = current ? `${current}/${entry.name}` : entry.name;
      if (entry.metadata) {
        paths.push(entryPath);
      } else {
        queue.push(entryPath);
      }
    }
  }

  return paths;
}

export async function deleteWorkspaceStorage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<void> {
  const buckets = [DOCUMENTS_BUCKET, WORKSPACE_ASSETS_BUCKET];

  for (const bucket of buckets) {
    const paths = await listAllStoragePaths(supabase, bucket, workspaceId);
    if (paths.length === 0) continue;

    const chunkSize = 100;
    for (let index = 0; index < paths.length; index += chunkSize) {
      const chunk = paths.slice(index, index + chunkSize);
      await supabase.storage.from(bucket).remove(chunk);
    }
  }
}
