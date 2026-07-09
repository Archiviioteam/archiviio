import { NextResponse } from "next/server";
import { isMailboxEncryptionConfigured } from "@/lib/email/encrypt-credentials";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MailboxConnection } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMailboxEncryptionConfigured()) {
    return NextResponse.json(
      { error: "MAILBOX_CREDENTIALS_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const { data: connection, error } = await supabase
    .from("mailbox_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!connection) {
    return NextResponse.json(
      { error: "No mailbox connected for this user." },
      { status: 404 }
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required for mailbox sync (archived email inserts).",
      },
      { status: 500 }
    );
  }

  try {
    const { syncMailboxConnection } = await import("@/lib/email/sync-mailbox");
    const result = await syncMailboxConnection(
      admin,
      connection as MailboxConnection
    );
    return NextResponse.json(result);
  } catch (syncError) {
    const message =
      syncError instanceof Error ? syncError.message : "Mailbox sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
