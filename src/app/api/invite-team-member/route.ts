import { NextResponse } from "next/server";
import { sendWorkspaceInviteEmail } from "@/lib/email/send-workspace-invite-email";
import {
  getWorkspaceInvitePreview,
  getWorkspaceInviteUrl,
} from "@/lib/invitations/workspace-invite";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: inviteToken, error: inviteError } = await supabase.rpc(
    "invite_workspace_member",
    { invitee_email: email }
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  if (typeof inviteToken !== "string" || !inviteToken.trim()) {
    return NextResponse.json(
      { error: "Failed to create invitation link." },
      { status: 500 }
    );
  }

  const inviteUrl = getWorkspaceInviteUrl(inviteToken);

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({
      inviteToken,
      inviteUrl,
      emailed: false,
    });
  }

  const preview = await getWorkspaceInvitePreview(supabaseAdmin, inviteToken);
  const workspaceName = preview?.workspaceName ?? "Workspace";

  const emailResult = await sendWorkspaceInviteEmail({
    to: email,
    workspaceName,
    inviteUrl,
  });

  if (!emailResult.sent) {
    console.error("Workspace invite email failed", {
      to: email,
      error: emailResult.error,
    });
  }

  return NextResponse.json({
    inviteToken,
    inviteUrl,
    emailed: emailResult.sent,
    ...(emailResult.error ? { emailError: emailResult.error } : {}),
  });
}
