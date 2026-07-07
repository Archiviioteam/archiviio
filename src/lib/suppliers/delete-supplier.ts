import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

type DeleteSupplierResult = { ok: true } | { ok: false; error: string };

interface DeleteSupplierInput {
  supabase: SupabaseClient;
  workspaceId: string;
  supplierId: string;
  company: string;
}

export async function deleteSupplier({
  supabase,
  workspaceId,
  supplierId,
  company,
}: DeleteSupplierInput): Promise<DeleteSupplierResult> {
  const activityLogged = await logActivity(supabase, {
    workspaceId,
    action: "supplier.deleted",
    entityType: "supplier",
    entityId: supplierId,
    title: company,
  });

  if (!activityLogged) {
    return {
      ok: false,
      error: "Could not record this deletion in recent activity.",
    };
  }

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
