import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

type UnlinkContactResult = { ok: true } | { ok: false; error: string };

export interface UnlinkContactFromProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  contactId: string;
  contactName: string;
}

export async function unlinkContactFromProject({
  supabase,
  workspaceId,
  projectId,
  contactId,
  contactName,
}: UnlinkContactFromProjectInput): Promise<UnlinkContactResult> {
  const { error } = await supabase
    .from("project_contacts")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .eq("contact_id", contactId);

  if (error) {
    return {
      ok: false,
      error: error.message ?? "Failed to remove contact from project",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "contact.unlinked",
    entityType: "contact",
    entityId: contactId,
    projectId,
    title: contactName,
  });

  return { ok: true };
}
