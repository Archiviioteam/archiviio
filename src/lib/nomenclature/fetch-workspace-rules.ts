import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatClientError,
  formatSupabaseError,
} from "@/lib/supabase/format-error";
import type { WorkspaceNomenclatureRule } from "@/types/database";

type FetchRulesResult =
  | { ok: true; rules: WorkspaceNomenclatureRule[] }
  | { ok: false; rules: WorkspaceNomenclatureRule[]; error: string };

export async function fetchWorkspaceNomenclatureRules(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<FetchRulesResult> {
  try {
    const { data, error } = await supabase
      .from("workspace_nomenclature_rules")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("title", { ascending: true });

    if (error) {
      return {
        ok: false,
        rules: [],
        error: formatSupabaseError(error.message),
      };
    }

    return {
      ok: true,
      rules: (data ?? []) as WorkspaceNomenclatureRule[],
    };
  } catch (error) {
    return {
      ok: false,
      rules: [],
      error: formatClientError(error, "Failed to load nomenclature rules"),
    };
  }
}
