import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

type UnlinkSupplierResult = { ok: true } | { ok: false; error: string };

export interface UnlinkSupplierFromProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
}

export async function unlinkSupplierFromProject({
  supabase,
  workspaceId,
  projectId,
  supplierId,
  supplierName,
}: UnlinkSupplierFromProjectInput): Promise<UnlinkSupplierResult> {
  const { error } = await supabase
    .from("project_suppliers")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .eq("supplier_id", supplierId);

  if (error) {
    return {
      ok: false,
      error: error.message ?? "Failed to remove supplier from project",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "supplier.unlinked",
    entityType: "supplier",
    entityId: supplierId,
    projectId,
    title: supplierName,
  });

  return { ok: true };
}
