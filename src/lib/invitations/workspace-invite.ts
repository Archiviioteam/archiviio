import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAuthError } from "@/lib/supabase/format-error";
import { getSiteUrl } from "@/lib/supabase/site-url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WorkspaceInvitePreview = {
  workspaceName: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
};

type InvitationRow = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  workspace_id: string;
  workspaces: { name: string } | { name: string }[] | null;
};

function readWorkspaceName(workspaces: InvitationRow["workspaces"]): string {
  if (!workspaces) {
    return "Workspace";
  }

  if (Array.isArray(workspaces)) {
    return workspaces[0]?.name?.trim() || "Workspace";
  }

  return workspaces.name?.trim() || "Workspace";
}

export function getWorkspaceInviteUrl(token: string): string {
  return `${getSiteUrl()}/invite/${token}`;
}

export async function getWorkspaceInvitePreview(
  supabaseAdmin: SupabaseClient,
  token: string
): Promise<WorkspaceInvitePreview | null> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_invitations")
    .select("email, status, workspace_id, workspaces(name)")
    .eq("token", normalizedToken)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const invitation = data as InvitationRow;

  return {
    workspaceName: readWorkspaceName(invitation.workspaces),
    email: invitation.email,
    status: invitation.status,
  };
}

async function resolveAuthUserId(
  supabaseAdmin: SupabaseClient,
  email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!createError && created.user) {
    return { userId: created.user.id };
  }

  const duplicate =
    createError?.code === "email_exists" ||
    createError?.message?.toLowerCase().includes("already") === true;

  if (!duplicate) {
    return {
      error: formatAuthError(createError, "Could not create account. Please try again."),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    return { error: "Authentication is not configured on the server." };
  }

  const anonClient = createAnonClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signedIn, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signedIn.user) {
    return {
      error:
        "An account with this email already exists. Enter the correct password for this invitation.",
    };
  }

  return { userId: signedIn.user.id };
}

export async function acceptWorkspaceInvitation(
  supabaseAdmin: SupabaseClient,
  token: string,
  email: string,
  password: string
): Promise<{ ok: true } | { error: string }> {
  const normalizedToken = token.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedToken) {
    return { error: "Invitation link is invalid." };
  }

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_invitations")
    .select("id, email, status, workspace_id")
    .eq("token", normalizedToken)
    .maybeSingle();

  if (error || !data) {
    return { error: "This invitation link is invalid or has expired." };
  }

  const invitation = data as {
    id: string;
    email: string;
    status: "pending" | "accepted" | "revoked";
    workspace_id: string;
  };

  if (invitation.status === "revoked") {
    return { error: "This invitation is no longer valid." };
  }

  if (invitation.email !== normalizedEmail) {
    return { error: "Use the same email address that received the invitation." };
  }

  const authResult = await resolveAuthUserId(
    supabaseAdmin,
    normalizedEmail,
    password
  );

  if ("error" in authResult) {
    return authResult;
  }

  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("workspace_id")
    .eq("id", authResult.userId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  const profile = existingProfile as { workspace_id: string } | null;

  if (profile?.workspace_id) {
    if (profile.workspace_id !== invitation.workspace_id) {
      return {
        error:
          "This account already belongs to another workspace. Use a different email address.",
      };
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: authResult.userId,
      workspace_id: invitation.workspace_id,
      email: normalizedEmail,
      role: "member",
    } as never);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  if (invitation.status === "pending") {
    const { error: updateError } = await supabaseAdmin
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  return { ok: true };
}
