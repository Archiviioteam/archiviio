import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidEmail } from "@/lib/settings/validation";

export type InviteTeamMemberResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeInviteError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("already in your workspace")) {
    return "This person is already in your workspace";
  }

  if (lower.includes("only workspace owners")) {
    return "Only workspace owners can send invitations";
  }

  if (lower.includes("valid email")) {
    return "Enter a valid email address";
  }

  return message;
}

async function inviteViaApiRoute(
  email: string
): Promise<InviteTeamMemberResult & { emailed?: boolean; unavailable?: boolean }> {
  let response: Response;

  try {
    response = await fetch("/api/invite-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    return { ok: false, error: "Failed to send invitation", unavailable: true };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const message =
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
      ? data.error
      : "Failed to send invitation";

  if (response.status === 503) {
    return { ok: false, error: message, unavailable: true };
  }

  if (!response.ok) {
    return { ok: false, error: normalizeInviteError(message) };
  }

  return { ok: true, emailed: true };
}

async function inviteViaEdgeFunction(
  supabase: SupabaseClient,
  email: string
): Promise<InviteTeamMemberResult> {
  const { data, error } = await supabase.functions.invoke("invite-team-member", {
    body: { email },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data && typeof data === "object" && "error" in data) {
    const message =
      typeof data.error === "string" ? data.error : "Failed to send invitation";
    return { ok: false, error: normalizeInviteError(message) };
  }

  return { ok: true };
}

async function inviteViaRpc(
  supabase: SupabaseClient,
  email: string
): Promise<InviteTeamMemberResult & { emailed?: boolean }> {
  const { error } = await supabase.rpc("invite_workspace_member", {
    invitee_email: email,
  });

  if (error) {
    return { ok: false, error: normalizeInviteError(error.message) };
  }

  return { ok: true, emailed: false };
}

export async function inviteTeamMember(
  supabase: SupabaseClient,
  email: string
): Promise<InviteTeamMemberResult & { emailed?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const apiResult = await inviteViaApiRoute(normalizedEmail);
  if (apiResult.ok) {
    return apiResult;
  }

  if (!apiResult.unavailable) {
    return apiResult;
  }

  const edgeResult = await inviteViaEdgeFunction(supabase, normalizedEmail);
  if (edgeResult.ok) {
    return { ...edgeResult, emailed: true };
  }

  const edgeUnavailable =
    edgeResult.error.includes("Failed to send a request to the Edge Function") ||
    edgeResult.error.includes("Function not found") ||
    edgeResult.error.includes("404");

  if (!edgeUnavailable) {
    return edgeResult;
  }

  return inviteViaRpc(supabase, normalizedEmail);
}
