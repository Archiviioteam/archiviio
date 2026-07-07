import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Supplier } from "@/types/database";

type LinkSupplierResult =
  | { ok: true; supplier: Supplier }
  | { ok: false; error: string };

export interface LinkSupplierToProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
}

export async function linkSupplierToProject({
  supabase,
  workspaceId,
  projectId,
  supplierId,
  supplierName,
}: LinkSupplierToProjectInput): Promise<LinkSupplierResult> {
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .eq("workspace_id", workspaceId)
    .single();

  if (supplierError || !supplier) {
    return { ok: false, error: "Supplier not found." };
  }

  const { error } = await supabase.from("project_suppliers").insert({
    workspace_id: workspaceId,
    project_id: projectId,
    supplier_id: supplierId,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Supplier is already linked to this project.",
      };
    }

    return {
      ok: false,
      error: error.message ?? "Failed to link supplier",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "supplier.linked",
    entityType: "supplier",
    entityId: supplierId,
    projectId,
    title: supplierName,
  });

  return { ok: true, supplier: supplier as Supplier };
}
