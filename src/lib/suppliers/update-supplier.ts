import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Supplier, SupplierCompanyType } from "@/types/database";

type UpdateSupplierResult =
  | { ok: true; supplier: Supplier }
  | { ok: false; error: string };

export interface UpdateSupplierInput {
  supabase: SupabaseClient;
  workspaceId: string;
  supplierId: string;
  company: string;
  companyTypes: SupplierCompanyType[];
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  inMaterialLibrary?: boolean;
}

export async function updateSupplier({
  supabase,
  workspaceId,
  supplierId,
  company,
  companyTypes,
  contactName = null,
  email = null,
  phone = null,
  website = null,
  inMaterialLibrary = false,
}: UpdateSupplierInput): Promise<UpdateSupplierResult> {
  const trimmedCompany = company.trim();
  const trimmedContactName = contactName?.trim() || null;
  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;
  const trimmedWebsite = website?.trim() || null;

  if (!trimmedCompany) {
    return { ok: false, error: "Company is required." };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: trimmedCompany,
      company: trimmedCompany,
      company_types: companyTypes,
      contact_name: trimmedContactName,
      email: trimmedEmail,
      phone: trimmedPhone,
      website: trimmedWebsite,
      in_material_library: inMaterialLibrary,
    })
    .eq("id", supplierId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update supplier",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "supplier.updated",
    entityType: "supplier",
    entityId: data.id,
    title: trimmedCompany,
  });

  return { ok: true, supplier: data as Supplier };
}
