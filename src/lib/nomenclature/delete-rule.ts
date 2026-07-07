import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";

type DeleteRuleResult = { ok: true } | { ok: false; error: string };

export interface DeleteNomenclatureRuleInput {
  supabase: SupabaseClient;
  workspaceId: string;
  ruleId: string;
}

export async function deleteNomenclatureRule({
  supabase,
  workspaceId,
  ruleId,
}: DeleteNomenclatureRuleInput): Promise<DeleteRuleResult> {
  try {
    const { error } = await supabase
      .from("workspace_nomenclature_rules")
      .delete()
      .eq("id", ruleId)
      .eq("workspace_id", workspaceId);

    if (error) {
      return { ok: false, error: formatSupabaseError(error.message) };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: formatClientError(error, "Failed to delete rule"),
    };
  }
}
