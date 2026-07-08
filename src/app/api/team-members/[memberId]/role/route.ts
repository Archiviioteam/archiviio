import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AllowedRole = "owner" | "member";

function isAllowedRole(value: string): value is AllowedRole {
  return value === "owner" || value === "member";
}

export const runtime = "nodejs";
export const maxDuration = 30;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await context.params;
  if (!memberId) {
    return NextResponse.json({ error: "Member id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role =
    typeof body === "object" &&
    body !== null &&
    "role" in body &&
    typeof body.role === "string"
      ? body.role
      : "";

  if (!isAllowedRole(role)) {
    return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("users")
    .select("id,workspace_id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentMemberError || !currentMember) {
    return NextResponse.json({ error: "Current member not found" }, { status: 403 });
  }

  const { data: targetMember, error: targetMemberError } = await supabase
    .from("users")
    .select("id,workspace_id,role")
    .eq("id", memberId)
    .maybeSingle();

  if (targetMemberError || !targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (targetMember.workspace_id !== currentMember.workspace_id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration is missing" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", currentMember.workspace_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, memberId, role });
}
