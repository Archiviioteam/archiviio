import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Contact, ContactType } from "@/types/database";

type UpdateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

export interface UpdateContactInput {
  supabase: SupabaseClient;
  workspaceId: string;
  contactId: string;
  name: string;
  type: ContactType;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function updateContact({
  supabase,
  workspaceId,
  contactId,
  name,
  type,
  company = null,
  email = null,
  phone = null,
}: UpdateContactInput): Promise<UpdateContactResult> {
  const trimmedName = name.trim();
  const trimmedCompany = company?.trim() || null;
  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;

  if (!trimmedName) {
    return { ok: false, error: "Name is required." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      name: trimmedName,
      type,
      company: trimmedCompany,
      email: trimmedEmail,
      phone: trimmedPhone,
    })
    .eq("id", contactId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update contact",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "contact.updated",
    entityType: "contact",
    entityId: data.id,
    title: trimmedName,
  });

  return { ok: true, contact: data as Contact };
}
