import { ImapFlow } from "imapflow";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptMailboxPassword } from "@/lib/email/encrypt-credentials";
import {
  DEFAULT_IMAP_HOST,
  DEFAULT_IMAP_PORT,
  DEFAULT_SENT_FOLDER,
  extractSnippet,
  type ImapConnectionConfig,
} from "@/lib/email/imap-constants";
import { matchEmailToProject } from "@/lib/email/match-project";
import type {
  ArchivedEmail,
  EmailDirection,
  MailboxConnection,
  Project,
} from "@/types/database";

interface ParsedImapMessage {
  uid: number;
  folder: string;
  direction: EmailDirection;
  messageId: string | null;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  sentAt: string;
  snippet: string;
  source: Buffer | null;
}

interface SyncMailboxResult {
  imported: number;
  matched: number;
  errors: string[];
  hasMore: boolean;
}

const MAX_MESSAGES_PER_FOLDER_SYNC = 40;

function toIsoDate(value: string | Date | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function addressList(
  entries: Array<{ address?: string; name?: string }> | undefined
): string[] {
  return (entries ?? [])
    .map((entry) => entry.address?.trim())
    .filter((address): address is string => Boolean(address));
}

function firstAddress(
  entries: Array<{ address?: string; name?: string }> | undefined
): { address: string; name: string | null } {
  const first = entries?.[0];
  return {
    address: first?.address?.trim() ?? "",
    name: first?.name?.trim() ?? null,
  };
}

async function listNewMessages(
  config: ImapConnectionConfig,
  folder: string,
  direction: EmailDirection,
  afterUid: number
): Promise<ParsedImapMessage[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const uidRange = afterUid > 0 ? `${afterUid + 1}:*` : "1:*";
      const messages: ParsedImapMessage[] = [];
      let fetched = 0;

      for await (const message of client.fetch(uidRange, {
        uid: true,
        envelope: true,
        internalDate: true,
      })) {
        if (!message.uid) continue;
        if (fetched >= MAX_MESSAGES_PER_FOLDER_SYNC) {
          break;
        }
        fetched += 1;

        const envelope = message.envelope;
        const from = firstAddress(envelope?.from);

        messages.push({
          uid: message.uid,
          folder,
          direction,
          messageId: envelope?.messageId ?? null,
          subject: envelope?.subject ?? "",
          fromAddress: from.address,
          fromName: from.name,
          toAddresses: addressList(envelope?.to),
          ccAddresses: addressList(envelope?.cc),
          sentAt: toIsoDate(envelope?.date ?? message.internalDate),
          snippet: "",
          source: null,
        });
      }

      return messages;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

async function buildMatchContext(
  supabase: SupabaseClient,
  workspaceId: string,
  messageId: string | null
) {
  const { data: projects } = await supabase
    .from("projects")
    .select("id, workspace_id, name, code, location, status, created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "archived");

  const { data: keywords } = await supabase
    .from("project_email_keywords")
    .select("project_id, keyword")
    .eq("workspace_id", workspaceId);

  const { data: projectContacts } = await supabase
    .from("project_contacts")
    .select("project_id, contacts(email)")
    .eq("workspace_id", workspaceId);

  const { data: projectSuppliers } = await supabase
    .from("project_suppliers")
    .select("project_id, suppliers(email)")
    .eq("workspace_id", workspaceId);

  const keywordsByProjectId = new Map<string, string[]>();
  for (const row of keywords ?? []) {
    const list = keywordsByProjectId.get(row.project_id) ?? [];
    list.push(row.keyword);
    keywordsByProjectId.set(row.project_id, list);
  }

  const contactEmailsByProjectId = new Map<string, string[]>();
  for (const row of projectContacts ?? []) {
    const email = (row.contacts as { email?: string | null } | null)?.email;
    if (!email?.trim()) continue;
    const list = contactEmailsByProjectId.get(row.project_id) ?? [];
    list.push(email);
    contactEmailsByProjectId.set(row.project_id, list);
  }

  const supplierEmailsByProjectId = new Map<string, string[]>();
  for (const row of projectSuppliers ?? []) {
    const email = (row.suppliers as { email?: string | null } | null)?.email;
    if (!email?.trim()) continue;
    const list = supplierEmailsByProjectId.get(row.project_id) ?? [];
    list.push(email);
    supplierEmailsByProjectId.set(row.project_id, list);
  }

  let threadProjectId: string | null = null;
  if (messageId) {
    const { data: threadEmail } = await supabase
      .from("archived_emails")
      .select("project_id")
      .eq("workspace_id", workspaceId)
      .eq("message_id", messageId)
      .not("project_id", "is", null)
      .limit(1)
      .maybeSingle();

    threadProjectId = threadEmail?.project_id ?? null;
  }

  return {
    projects: (projects as Project[]) ?? [],
    keywordsByProjectId,
    contactEmailsByProjectId,
    supplierEmailsByProjectId,
    threadProjectId,
  };
}

export async function testImapConnection(config: ImapConnectionConfig): Promise<void> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  await client.connect();
  await client.logout();
}

export async function syncMailboxConnection(
  supabase: SupabaseClient,
  connection: MailboxConnection
): Promise<SyncMailboxResult> {
  const config: ImapConnectionConfig = {
    host: connection.imap_host || DEFAULT_IMAP_HOST,
    port: connection.imap_port || DEFAULT_IMAP_PORT,
    secure: connection.imap_secure,
    username: connection.imap_username,
    password: decryptMailboxPassword(connection.password_encrypted),
    sentFolder: connection.sent_folder || DEFAULT_SENT_FOLDER,
  };

  const result: SyncMailboxResult = {
    imported: 0,
    matched: 0,
    errors: [],
    hasMore: false,
  };

  const folders: Array<{
    folder: string;
    direction: EmailDirection;
    afterUid: number;
    uidField: "last_uid_inbox" | "last_uid_sent";
  }> = [
    {
      folder: "INBOX",
      direction: "inbound",
      afterUid: connection.last_uid_inbox,
      uidField: "last_uid_inbox",
    },
    {
      folder: config.sentFolder,
      direction: "outbound",
      afterUid: connection.last_uid_sent,
      uidField: "last_uid_sent",
    },
  ];

  const matchContext = await buildMatchContext(
    supabase,
    connection.workspace_id,
    null
  );

  let maxInboxUid = connection.last_uid_inbox;
  let maxSentUid = connection.last_uid_sent;

  for (const folderConfig of folders) {
    try {
      const messages = await listNewMessages(
        config,
        folderConfig.folder,
        folderConfig.direction,
        folderConfig.afterUid
      );

      if (messages.length >= MAX_MESSAGES_PER_FOLDER_SYNC) {
        result.hasMore = true;
      }

      for (const message of messages) {
        if (folderConfig.uidField === "last_uid_inbox") {
          maxInboxUid = Math.max(maxInboxUid, message.uid);
        } else {
          maxSentUid = Math.max(maxSentUid, message.uid);
        }

        const threadContext = message.messageId
          ? {
              ...matchContext,
              threadProjectId:
                (
                  await supabase
                    .from("archived_emails")
                    .select("project_id")
                    .eq("workspace_id", connection.workspace_id)
                    .eq("message_id", message.messageId)
                    .not("project_id", "is", null)
                    .limit(1)
                    .maybeSingle()
                ).data?.project_id ?? matchContext.threadProjectId,
            }
          : matchContext;

        const match = matchEmailToProject({
          subject: message.subject,
          fromAddress: message.fromAddress,
          toAddresses: message.toAddresses,
          ccAddresses: message.ccAddresses,
          context: threadContext,
        });

        const { error } = await supabase.from("archived_emails").upsert(
          {
            workspace_id: connection.workspace_id,
            project_id: match.projectId,
            mailbox_connection_id: connection.id,
            mailbox_user_id: connection.user_id,
            direction: message.direction,
            message_id: message.messageId,
            imap_uid: message.uid,
            imap_folder: message.folder,
            subject: message.subject,
            from_address: message.fromAddress,
            from_name: message.fromName,
            to_addresses: message.toAddresses,
            cc_addresses: message.ccAddresses,
            sent_at: message.sentAt,
            snippet: message.snippet,
            match_status: match.projectId ? "auto" : "unmatched",
            match_confidence: match.confidence,
            matched_rule: match.rule,
          } as never,
          { onConflict: "mailbox_connection_id,imap_folder,imap_uid" }
        );

        if (error) {
          result.errors.push(error.message);
          continue;
        }

        result.imported += 1;
        if (match.projectId) result.matched += 1;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown IMAP sync error";
      result.errors.push(`${folderConfig.folder}: ${message}`);
    }
  }

  await supabase
    .from("mailbox_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: result.errors[0] ?? null,
      last_uid_inbox: maxInboxUid,
      last_uid_sent: maxSentUid,
    } as never)
    .eq("id", connection.id);

  return result;
}

export async function fetchArchivedEmailBody(
  connection: MailboxConnection,
  email: Pick<ArchivedEmail, "imap_folder" | "imap_uid">
): Promise<string | null> {
  const config: ImapConnectionConfig = {
    host: connection.imap_host || DEFAULT_IMAP_HOST,
    port: connection.imap_port || DEFAULT_IMAP_PORT,
    secure: connection.imap_secure,
    username: connection.imap_username,
    password: decryptMailboxPassword(connection.password_encrypted),
    sentFolder: connection.sent_folder || DEFAULT_SENT_FOLDER,
  };

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock(email.imap_folder);
    try {
      const message = await client.fetchOne(
        String(email.imap_uid),
        { uid: true, source: true },
        { uid: true }
      );
      if (!message || !message.source) return null;
      const source = Buffer.isBuffer(message.source)
        ? message.source
        : Buffer.from(message.source);
      return extractSnippet(source, 20_000);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
