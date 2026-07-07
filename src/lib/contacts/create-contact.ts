import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Contact, ContactType } from "@/types/database";

type CreateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

export interface CreateContactInput {
  supabase: SupabaseClient;
  workspaceId: string;
  name: string;
  type: ContactType;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function createContact({
  supabase,
  workspaceId,
  name,
  type,
  company = null,
  email = null,
  phone = null,
}: CreateContactInput): Promise<CreateContactResult> {
  const trimmedName = name.trim();
  const trimmedCompany = company?.trim() || null;
  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;

  if (!trimmedName) {
    return { ok: false, error: "Name is required." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      name: trimmedName,
      type,
      company: trimmedCompany,
      email: trimmedEmail,
      phone: trimmedPhone,
      tags: [],
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create contact",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "contact.created",
    entityType: "contact",
    entityId: data.id,
    title: trimmedName,
  });

  return { ok: true, contact: data as Contact };
}
