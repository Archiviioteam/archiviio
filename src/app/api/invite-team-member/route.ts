import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/supabase/site-url";

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

  const { data: invitationId, error: inviteError } = await supabase.rpc(
    "invite_workspace_member",
    { invitee_email: email }
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);
  const redirectTo = getAuthCallbackUrl();

  const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
      data: {
        workspace_invitation_id: invitationId,
      },
    }
  );

  if (emailError) {
    console.error("inviteUserByEmail failed", {
      message: emailError.message,
      status: "status" in emailError ? emailError.status : undefined,
      code: "code" in emailError ? emailError.code : undefined,
      name: "name" in emailError ? emailError.name : undefined,
      error: emailError,
    });

    const rawMessage =
      typeof emailError.message === "string" ? emailError.message.trim() : "";
    const fallbackMessage =
      "Unable to send invitation email. Check Supabase Auth email/SMTP settings.";
    const message = rawMessage && rawMessage !== "{}" ? rawMessage : fallbackMessage;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ invitationId, emailed: true });
}
