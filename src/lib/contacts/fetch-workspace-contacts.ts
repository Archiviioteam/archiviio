import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact } from "@/types/database";

export async function fetchWorkspaceContacts(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Contact[]> {
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId);

  return ((data as Contact[]) ?? []).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
