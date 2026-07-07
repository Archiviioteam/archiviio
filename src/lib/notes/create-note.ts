import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNote } from "@/types/database";

type CreateNoteResult =
  | { ok: true; note: WorkspaceNote }
  | { ok: false; error: string };

export interface CreateNoteInput {
  supabase: SupabaseClient;
  workspaceId: string;
  title?: string;
  content: string;
}

export function deriveNoteTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "Untitled note";
  }

  const firstLine = trimmed.split("\n")[0]?.trim() ?? trimmed;
  if (firstLine.length <= 80) {
    return firstLine;
  }

  return `${firstLine.slice(0, 77)}...`;
}

export async function createNote({
  supabase,
  workspaceId,
  title,
  content,
}: CreateNoteInput): Promise<CreateNoteResult> {
  const trimmedContent = content.trim();
  const trimmedTitle = (title?.trim() || deriveNoteTitle(trimmedContent)).trim();

  if (!trimmedTitle) {
    return { ok: false, error: "Note title is required." };
  }

  try {
    const { data, error } = await supabase
      .from("workspace_notes")
      .insert({
        workspace_id: workspaceId,
        title: trimmedTitle,
        content: trimmedContent,
      })
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: formatSupabaseError(error?.message ?? "Failed to create note"),
      };
    }

    return { ok: true, note: data as WorkspaceNote };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to create note"),
    };
  }
}
