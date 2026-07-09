import { NextResponse } from "next/server";
import {
  encryptMailboxPassword,
  isMailboxEncryptionConfigured,
} from "@/lib/email/encrypt-credentials";
import {
  DEFAULT_IMAP_HOST,
  DEFAULT_IMAP_PORT,
  DEFAULT_SENT_FOLDER,
} from "@/lib/email/imap-constants";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ConnectMailboxBody {
  email?: string;
  imapUsername?: string;
  imapPassword?: string;
  imapHost?: string;
  imapPort?: number;
  sentFolder?: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("mailbox_connections")
    .select(
      "id, email, imap_host, imap_port, imap_secure, imap_username, sent_folder, sync_enabled, last_sync_at, last_sync_error, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const message = error.message.includes("mailbox_connections")
      ? "Tabella mailbox non trovata. Applica la migration 031 su Supabase."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    connected: Boolean(data),
    encryptionConfigured: isMailboxEncryptionConfigured(),
    connection: data ?? null,
    stats: data
      ? await getMailboxEmailStats(supabase, data.id, user.id)
      : null,
  });
}

async function getMailboxEmailStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  connectionId: string,
  userId: string
) {
  const { count: total, error: totalError } = await supabase
    .from("archived_emails")
    .select("id", { count: "exact", head: true })
    .eq("mailbox_connection_id", connectionId);

  if (totalError) return null;

  const { count: unassigned, error: unassignedError } = await supabase
    .from("archived_emails")
    .select("id", { count: "exact", head: true })
    .eq("mailbox_connection_id", connectionId)
    .is("project_id", null);

  if (unassignedError) return null;

  const assigned = (total ?? 0) - (unassigned ?? 0);

  return {
    total: total ?? 0,
    unassigned: unassigned ?? 0,
    assigned,
    mailboxUserId: userId,
  };
}

export async function POST(request: Request) {
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

  let body: ConnectMailboxBody;
  try {
    body = (await request.json()) as ConnectMailboxBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const imapUsername = body.imapUsername?.trim() ?? email;
  const imapPassword = body.imapPassword ?? "";

  if (!email || !imapPassword) {
    return NextResponse.json(
      { error: "Email and IMAP password are required." },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceId(supabase);
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 400 });
  }

  const imapHost = body.imapHost?.trim() || DEFAULT_IMAP_HOST;
  const imapPort = body.imapPort ?? DEFAULT_IMAP_PORT;
  const sentFolder = body.sentFolder?.trim() || DEFAULT_SENT_FOLDER;

  try {
    const { testImapConnection } = await import("@/lib/email/sync-mailbox");
    await testImapConnection({
      host: imapHost,
      port: imapPort,
      secure: true,
      username: imapUsername,
      password: imapPassword,
      sentFolder,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "IMAP connection failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const encryptedPassword = encryptMailboxPassword(imapPassword);

  const { data, error } = await supabase
    .from("mailbox_connections")
    .upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        email,
        imap_host: imapHost,
        imap_port: imapPort,
        imap_secure: true,
        imap_username: imapUsername,
        password_encrypted: encryptedPassword,
        sent_folder: sentFolder,
        sync_enabled: true,
        last_sync_error: null,
      } as never,
      { onConflict: "user_id" }
    )
    .select(
      "id, email, imap_host, imap_port, imap_secure, imap_username, sent_folder, sync_enabled, last_sync_at, last_sync_error, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ connection: data });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("mailbox_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ disconnected: true });
}
