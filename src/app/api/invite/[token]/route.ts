import { NextResponse } from "next/server";
import { getWorkspaceInvitePreview } from "@/lib/invitations/workspace-invite";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Invitation service is not configured." },
      { status: 503 }
    );
  }

  const preview = await getWorkspaceInvitePreview(supabaseAdmin, token);

  if (!preview) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  return NextResponse.json(preview);
}
