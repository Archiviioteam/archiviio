import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNomenclatureRule } from "@/types/database";

type CreateRuleResult =
  | { ok: true; rule: WorkspaceNomenclatureRule }
  | { ok: false; error: string };

export interface CreateNomenclatureRuleInput {
  supabase: SupabaseClient;
  workspaceId: string;
  title: string;
  notes?: string;
}

export async function createNomenclatureRule({
  supabase,
  workspaceId,
  title,
  notes = "",
}: CreateNomenclatureRuleInput): Promise<CreateRuleResult> {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return { ok: false, error: "Title is required." };
  }

  try {
    const { data, error } = await supabase
      .from("workspace_nomenclature_rules")
      .insert({
        workspace_id: workspaceId,
        title: trimmedTitle,
        notes: notes.trim(),
      })
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: formatSupabaseError(error?.message ?? "Failed to create rule"),
      };
    }

    return { ok: true, rule: data as WorkspaceNomenclatureRule };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to create rule"),
    };
  }
}
