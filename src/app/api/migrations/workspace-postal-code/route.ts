import { NextResponse } from "next/server";
import { withDatabaseConnection } from "@/lib/supabase/database-connection";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member, error: memberError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (memberError || !member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: missingColumnError } = await supabase
    .from("workspaces")
    .select("postal_code")
    .limit(0);

  if (!missingColumnError) {
    return NextResponse.json({ ok: true, applied: false });
  }

  if (!/postal_code/i.test(missingColumnError.message)) {
    return NextResponse.json({ error: missingColumnError.message }, { status: 400 });
  }

  try {
    await withDatabaseConnection(async (client) => {
      await client.query(
        "alter table public.workspaces add column if not exists postal_code text"
      );
      await client.query("notify pgrst, 'reload schema'");
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to apply migration";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: verifyError } = await supabase
    .from("workspaces")
    .select("postal_code")
    .limit(0);

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, applied: true });
}
