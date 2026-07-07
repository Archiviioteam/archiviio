import type { SupabaseClient } from "@supabase/supabase-js";
import type { Supplier } from "@/types/database";

export async function fetchWorkspaceSuppliers(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Supplier[]> {
  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .eq("workspace_id", workspaceId);

  return ((data as Supplier[]) ?? []).sort((a, b) =>
    a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
  );
}
