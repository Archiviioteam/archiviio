import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Contact } from "@/types/database";

type LinkContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

export interface LinkContactToProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  contactId: string;
  contactName: string;
}

export async function linkContactToProject({
  supabase,
  workspaceId,
  projectId,
  contactId,
  contactName,
}: LinkContactToProjectInput): Promise<LinkContactResult> {
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("workspace_id", workspaceId)
    .single();

  if (contactError || !contact) {
    return { ok: false, error: "Contact not found." };
  }

  const { error } = await supabase.from("project_contacts").insert({
    workspace_id: workspaceId,
    project_id: projectId,
    contact_id: contactId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Contact is already linked to this project." };
    }

    return {
      ok: false,
      error: error.message ?? "Failed to link contact",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "contact.linked",
    entityType: "contact",
    entityId: contactId,
    projectId,
    title: contactName,
  });

  return { ok: true, contact: contact as Contact };
}
