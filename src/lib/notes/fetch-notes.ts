import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
  isSchemaCacheError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNote } from "@/types/database";

type FetchNotesResult =
  | { ok: true; notes: WorkspaceNote[] }
  | { ok: false; notes: WorkspaceNote[]; error: string };

const SCHEMA_CACHE_RETRY_ATTEMPTS = 4;
const SCHEMA_CACHE_RETRY_DELAY_MS = 2000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWorkspaceNotesOnce(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<FetchNotesResult> {
  const { data, error } = await supabase
    .from("workspace_notes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      notes: [],
      error: formatSupabaseError(error.message),
    };
  }

  return {
    ok: true,
    notes: (data ?? []) as WorkspaceNote[],
  };
}

export async function fetchWorkspaceNotes(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<FetchNotesResult> {
  try {
    let lastResult: FetchNotesResult = {
      ok: false,
      notes: [],
      error: "Failed to load notes",
    };

    for (let attempt = 0; attempt < SCHEMA_CACHE_RETRY_ATTEMPTS; attempt += 1) {
      lastResult = await fetchWorkspaceNotesOnce(supabase, workspaceId);

      if (lastResult.ok || !isSchemaCacheError(lastResult.error)) {
        return lastResult;
      }

      if (attempt < SCHEMA_CACHE_RETRY_ATTEMPTS - 1) {
        await wait(SCHEMA_CACHE_RETRY_DELAY_MS);
      }
    }

    return {
      ...lastResult,
      error:
        "Notes could not be loaded yet. Reload the page in a few seconds.",
    };
  } catch (error) {
    return {
      ok: false,
      notes: [],
      error: formatClientError(error, "Failed to load notes"),
    };
  }
}
