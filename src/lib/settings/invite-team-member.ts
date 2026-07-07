import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidEmail } from "@/lib/settings/validation";

export type InviteTeamMemberResult =
  | { ok: true; emailed: boolean; inviteUrl?: string; emailError?: string | null }
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

  if (lower.includes("rate limit")) {
    return "RATE_LIMIT_FALLBACK";
  }

  if (lower.includes("auth/v1/invite") || lower.includes("failed to invite user")) {
    return "RATE_LIMIT_FALLBACK";
  }

  return message;
}

type InviteApiPayload = {
  error?: string;
  emailed?: boolean;
  inviteUrl?: string;
  emailError?: string | null;
};

async function inviteViaApiRoute(
  email: string
): Promise<InviteTeamMemberResult & { unavailable?: boolean }> {
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

  let data: InviteApiPayload | null = null;
  try {
    data = (await response.json()) as InviteApiPayload;
  } catch {
    data = null;
  }

  const message =
    data?.error && typeof data.error === "string"
      ? data.error
      : "Failed to send invitation";

  if (!response.ok) {
    return { ok: false, error: normalizeInviteError(message) };
  }

  return {
    ok: true,
    emailed: data?.emailed === true,
    inviteUrl: typeof data?.inviteUrl === "string" ? data.inviteUrl : undefined,
    emailError: typeof data?.emailError === "string" ? data.emailError : null,
  };
}

async function inviteViaRpc(
  supabase: SupabaseClient,
  email: string
): Promise<InviteTeamMemberResult> {
  const { data: inviteToken, error } = await supabase.rpc("invite_workspace_member", {
    invitee_email: email,
  });

  if (error) {
    return { ok: false, error: normalizeInviteError(error.message) };
  }

  if (typeof inviteToken === "string" && inviteToken.trim()) {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/invite/${inviteToken}`
        : undefined;

    return { ok: true, emailed: false, inviteUrl };
  }

  return { ok: true, emailed: false };
}

export async function inviteTeamMember(
  supabase: SupabaseClient,
  email: string
): Promise<InviteTeamMemberResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const apiResult = await inviteViaApiRoute(normalizedEmail);
  if (apiResult.ok) {
    return apiResult;
  }

  const shouldFallbackToRpc =
    apiResult.unavailable ||
    apiResult.error === "RATE_LIMIT_FALLBACK";

  if (!shouldFallbackToRpc) {
    return apiResult;
  }

  return inviteViaRpc(supabase, normalizedEmail);
}
