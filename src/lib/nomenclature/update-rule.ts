import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNomenclatureRule } from "@/types/database";

type UpdateRuleResult =
  | { ok: true; rule: WorkspaceNomenclatureRule }
  | { ok: false; error: string };

export interface UpdateNomenclatureRuleInput {
  supabase: SupabaseClient;
  workspaceId: string;
  ruleId: string;
  title: string;
  notes?: string;
}

export async function updateNomenclatureRule({
  supabase,
  workspaceId,
  ruleId,
  title,
  notes = "",
}: UpdateNomenclatureRuleInput): Promise<UpdateRuleResult> {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return { ok: false, error: "Title is required." };
  }

  try {
    const { data, error } = await supabase
      .from("workspace_nomenclature_rules")
      .update({
        title: trimmedTitle,
        notes: notes.trim(),
      })
      .eq("id", ruleId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: formatSupabaseError(error?.message ?? "Failed to update rule"),
      };
    }

    return { ok: true, rule: data as WorkspaceNomenclatureRule };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to update rule"),
    };
  }
}
