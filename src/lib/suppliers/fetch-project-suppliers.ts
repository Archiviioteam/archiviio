import type { SupabaseClient } from "@supabase/supabase-js";
import type { Supplier } from "@/types/database";

export async function fetchProjectSuppliers(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string
): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("project_suppliers")
    .select("supplier:suppliers(*)")
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch project suppliers:", error.message);
    return [];
  }

  return (
    (data ?? [])
      .map((row) => {
        const supplier = row.supplier;
        return Array.isArray(supplier) ? supplier[0] : supplier;
      })
      .filter((supplier): supplier is Supplier => Boolean(supplier))
      .sort((a, b) =>
        a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
      )
  );
}
