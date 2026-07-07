import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNote } from "@/types/database";

type UpdateNoteResult =
  | { ok: true; note: WorkspaceNote }
  | { ok: false; error: string };

export interface UpdateNoteInput {
  supabase: SupabaseClient;
  workspaceId: string;
  noteId: string;
  title: string;
  content?: string;
}

export async function updateNote({
  supabase,
  workspaceId,
  noteId,
  title,
  content = "",
}: UpdateNoteInput): Promise<UpdateNoteResult> {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return { ok: false, error: "Title is required." };
  }

  try {
    const { data, error } = await supabase
      .from("workspace_notes")
      .update({
        title: trimmedTitle,
        content: content.trim(),
      })
      .eq("id", noteId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: formatSupabaseError(error?.message ?? "Failed to update note"),
      };
    }

    return { ok: true, note: data as WorkspaceNote };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to update note"),
    };
  }
}
