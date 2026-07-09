import { NextResponse } from "next/server";
import { isMailboxEncryptionConfigured } from "@/lib/email/encrypt-credentials";
import { fetchArchivedEmailBody } from "@/lib/email/sync-mailbox";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ArchivedEmail, MailboxConnection } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMailboxEncryptionConfigured()) {
    return NextResponse.json(
      { error: "MAILBOX_CREDENTIALS_SECRET is not configured." },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  const { data: email, error } = await supabase
    .from("archived_emails")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !email) {
    return NextResponse.json({ error: "Email not found." }, { status: 404 });
  }

  const typedEmail = email as ArchivedEmail;
  if (typedEmail.body_text) {
    return NextResponse.json({ body: typedEmail.body_text });
  }

  const admin = getSupabaseAdmin();
  const lookupClient = admin ?? supabase;

  const { data: connection, error: connectionError } = await lookupClient
    .from("mailbox_connections")
    .select("*")
    .eq("id", typedEmail.mailbox_connection_id)
    .single();

  if (connectionError || !connection) {
    return NextResponse.json(
      { error: "Mailbox connection not found." },
      { status: 404 }
    );
  }

  try {
    const body = await fetchArchivedEmailBody(
      connection as MailboxConnection,
      typedEmail
    );

    if (body && admin) {
      await admin
        .from("archived_emails")
        .update({ body_text: body } as never)
        .eq("id", typedEmail.id);
    }

    return NextResponse.json({ body: body ?? "" });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : "Failed to fetch body";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
