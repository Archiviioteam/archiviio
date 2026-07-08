import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await context.params;
  if (!memberId) {
    return NextResponse.json({ error: "Member id is required" }, { status: 400 });
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

  if (currentMember.role !== "owner") {
    return NextResponse.json(
      { error: "Only workspace owners can remove members" },
      { status: 403 }
    );
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

  if (targetMember.role === "owner") {
    return NextResponse.json(
      { error: "Workspace owners cannot be removed" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration is missing" },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", currentMember.workspace_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, memberId });
}
