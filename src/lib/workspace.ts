import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workspace } from "@/types/database";

let cachedWorkspaceId: string | null | undefined;

export function setCachedWorkspaceId(workspaceId: string | null): void {
  cachedWorkspaceId = workspaceId;
}

export function clearCachedWorkspaceId(): void {
  cachedWorkspaceId = undefined;
}

export async function getUserWorkspace(
  supabase: SupabaseClient
): Promise<Workspace | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("workspace_id, workspaces(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.workspaces) return null;

  return profile.workspaces as unknown as Workspace;
}

export async function getWorkspaceId(
  supabase: SupabaseClient
): Promise<string | null> {
  if (cachedWorkspaceId) {
    return cachedWorkspaceId;
  }

  const workspace = await getUserWorkspace(supabase);
  if (workspace?.id) {
    setCachedWorkspaceId(workspace.id);
  }

  return workspace?.id ?? null;
}

function defaultWorkspaceName(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || "My studio";
}

function workspaceNameFromUserMetadata(
  metadata: Record<string, unknown> | undefined,
  email: string
): string {
  const fromMetadata = metadata?.workspace_name;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  return defaultWorkspaceName(email);
}

export async function ensureUserWorkspace(
  supabase: SupabaseClient
): Promise<{ workspace: Workspace } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const existing = await getUserWorkspace(supabase);
  if (existing) {
    setCachedWorkspaceId(existing.id);
    return { workspace: existing };
  }

  const email = user.email ?? "";
  const result = await setupWorkspaceForUser(
    supabase,
    user.id,
    email,
    workspaceNameFromUserMetadata(user.user_metadata, email)
  );

  if ("error" in result) {
    return result;
  }

  const workspace = await getUserWorkspace(supabase);
  if (!workspace) {
    return { error: "Workspace created but could not be loaded" };
  }

  setCachedWorkspaceId(workspace.id);
  return { workspace };
}

export async function setupWorkspaceForUser(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  workspaceName: string
): Promise<{ workspaceId: string } | { error: string }> {
  const { data: workspaceId, error } = await supabase.rpc("setup_signup_workspace", {
    user_email: email,
    workspace_name: workspaceName,
  });

  if (error) {
    return { error: error.message };
  }

  if (!workspaceId) {
    return { error: "Failed to create workspace" };
  }

  return { workspaceId: workspaceId as string };
}
