import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Supplier, SupplierCompanyType } from "@/types/database";

type CreateSupplierResult =
  | { ok: true; supplier: Supplier }
  | { ok: false; error: string };

export interface CreateSupplierInput {
  supabase: SupabaseClient;
  workspaceId: string;
  company: string;
  companyTypes: SupplierCompanyType[];
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  inMaterialLibrary?: boolean;
}

export async function createSupplier({
  supabase,
  workspaceId,
  company,
  companyTypes,
  contactName = null,
  email = null,
  phone = null,
  website = null,
  inMaterialLibrary = false,
}: CreateSupplierInput): Promise<CreateSupplierResult> {
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
    .insert({
      workspace_id: workspaceId,
      name: trimmedCompany,
      company: trimmedCompany,
      company_types: companyTypes,
      contact_name: trimmedContactName,
      email: trimmedEmail,
      phone: trimmedPhone,
      website: trimmedWebsite,
      in_material_library: inMaterialLibrary,
      tags: [],
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create supplier",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "supplier.created",
    entityType: "supplier",
    entityId: data.id,
    title: trimmedCompany,
  });

  return { ok: true, supplier: data as Supplier };
}
