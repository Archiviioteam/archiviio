import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact } from "@/types/database";

export async function fetchProjectContacts(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("project_contacts")
    .select("contact:contacts(*)")
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch project contacts:", error.message);
    return [];
  }

  return (
    (data ?? [])
      .map((row) => {
        const contact = row.contact;
        return Array.isArray(contact) ? contact[0] : contact;
      })
      .filter((contact): contact is Contact => Boolean(contact))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      )
  );
}
