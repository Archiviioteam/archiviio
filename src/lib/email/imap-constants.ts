export const DEFAULT_IMAP_HOST = "imaps.aruba.it";
export const DEFAULT_IMAP_PORT = 993;
export const DEFAULT_SENT_FOLDER = "INBOX.Sent";

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  sentFolder: string;
}

export function buildAppleMailOpenUrl(messageId: string | null): string | null {
  if (!messageId?.trim()) return null;
  const normalized = messageId.trim();
  const withBrackets =
    normalized.startsWith("<") && normalized.endsWith(">")
      ? normalized
      : `<${normalized}>`;
  return `message://${encodeURIComponent(withBrackets)}`;
}

export function formatEmailAddress(name: string | null, address: string): string {
  const trimmedAddress = address.trim();
  if (!name?.trim()) return trimmedAddress;
  return `${name.trim()} <${trimmedAddress}>`;
}

export function extractSnippet(source: Buffer | string, maxLength = 500): string {
  const text = Buffer.isBuffer(source) ? source.toString("utf8") : source;
  const stripped = text
    .replace(/=\r?\n/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxLength) return stripped;
  return `${stripped.slice(0, maxLength - 1)}…`;
}
