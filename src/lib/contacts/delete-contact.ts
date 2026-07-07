import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

type DeleteContactResult = { ok: true } | { ok: false; error: string };

interface DeleteContactInput {
  supabase: SupabaseClient;
  workspaceId: string;
  contactId: string;
  name: string;
}

export async function deleteContact({
  supabase,
  workspaceId,
  contactId,
  name,
}: DeleteContactInput): Promise<DeleteContactResult> {
  const activityLogged = await logActivity(supabase, {
    workspaceId,
    action: "contact.deleted",
    entityType: "contact",
    entityId: contactId,
    title: name,
  });

  if (!activityLogged) {
    return {
      ok: false,
      error: "Could not record this deletion in recent activity.",
    };
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
