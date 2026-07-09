import { NextResponse } from "next/server";
import { isMailboxEncryptionConfigured } from "@/lib/email/encrypt-credentials";
import { syncMailboxConnection } from "@/lib/email/sync-mailbox";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MailboxConnection } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMailboxEncryptionConfigured()) {
    return NextResponse.json(
      { error: "MAILBOX_CREDENTIALS_SECRET is not configured." },
      { status: 500 }
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 500 }
    );
  }

  const { data: connections, error } = await admin
    .from("mailbox_connections")
    .select("*")
    .eq("sync_enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    connectionId: string;
    email: string;
    imported: number;
    matched: number;
    errors: string[];
  }> = [];

  for (const connection of (connections as MailboxConnection[]) ?? []) {
    try {
      const result = await syncMailboxConnection(admin, connection);
      results.push({
        connectionId: connection.id,
        email: connection.email,
        ...result,
      });
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : "Sync failed";
      results.push({
        connectionId: connection.id,
        email: connection.email,
        imported: 0,
        matched: 0,
        errors: [message],
      });
    }
  }

  return NextResponse.json({
    synced: results.length,
    results,
  });
}
