import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteWorkspaceStorage } from "@/lib/settings/delete-workspace-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration is missing" },
      { status: 500 }
    );
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("users")
    .select("id,workspace_id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentMemberError || !currentMember) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  if (currentMember.role === "owner") {
    const { data: members, error: membersError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("workspace_id", currentMember.workspace_id);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 400 });
    }

    const memberIds = (members ?? []).map((member) => member.id as string);

    try {
      await deleteWorkspaceStorage(supabaseAdmin, currentMember.workspace_id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete workspace files";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { error: workspaceDeleteError } = await supabaseAdmin
      .from("workspaces")
      .delete()
      .eq("id", currentMember.workspace_id);

    if (workspaceDeleteError) {
      return NextResponse.json(
        { error: workspaceDeleteError.message },
        { status: 400 }
      );
    }

    for (const memberId of memberIds) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(memberId);

      if (authDeleteError && memberId === user.id) {
        return NextResponse.json({ error: authDeleteError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  }

  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
