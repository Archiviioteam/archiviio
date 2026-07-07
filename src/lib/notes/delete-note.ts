import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";

type DeleteNoteResult = { ok: true } | { ok: false; error: string };

export interface DeleteNoteInput {
  supabase: SupabaseClient;
  workspaceId: string;
  noteId: string;
}

export async function deleteNote({
  supabase,
  workspaceId,
  noteId,
}: DeleteNoteInput): Promise<DeleteNoteResult> {
  try {
    const { error } = await supabase
      .from("workspace_notes")
      .delete()
      .eq("id", noteId)
      .eq("workspace_id", workspaceId);

    if (error) {
      return { ok: false, error: formatSupabaseError(error.message) };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to delete note"),
    };
  }
}
