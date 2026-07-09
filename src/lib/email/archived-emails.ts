import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArchivedEmail, EmailDirection } from "@/types/database";

export interface FetchArchivedEmailsOptions {
  workspaceId: string;
  projectId?: string | null;
  direction?: EmailDirection;
  unassignedOnly?: boolean;
  limit?: number;
}

export async function fetchArchivedEmails(
  supabase: SupabaseClient,
  options: FetchArchivedEmailsOptions
): Promise<ArchivedEmail[]> {
  let query = supabase
    .from("archived_emails")
    .select("*")
    .eq("workspace_id", options.workspaceId)
    .order("sent_at", { ascending: false });

  if (options.projectId) {
    query = query.eq("project_id", options.projectId);
  }

  if (options.unassignedOnly) {
    query = query.is("project_id", null);
  }

  if (options.direction) {
    query = query.eq("direction", options.direction);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data as ArchivedEmail[]) ?? []).map((email) => ({
    ...email,
    to_addresses: email.to_addresses ?? [],
    cc_addresses: email.cc_addresses ?? [],
  }));
}

export async function moveArchivedEmailToProject(
  supabase: SupabaseClient,
  emailId: string,
  projectId: string | null
): Promise<ArchivedEmail> {
  const { data, error } = await supabase
    .from("archived_emails")
    .update({
      project_id: projectId,
      match_status: projectId ? "manual" : "unmatched",
      match_confidence: projectId ? 100 : 0,
      matched_rule: projectId ? "manual_move" : null,
    } as never)
    .eq("id", emailId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to move email");
  }

  return data as ArchivedEmail;
}
