"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { formatDateTime } from "@/lib/date-format";
import { readJsonResponse } from "@/lib/http/read-json-response";
import {
  DEFAULT_IMAP_HOST,
  DEFAULT_SENT_FOLDER,
} from "@/lib/email/imap-constants";
import { useAppLanguage } from "@/lib/settings/language";
import type { MailboxConnection } from "@/types/database";

type MailboxConnectionSummary = Pick<
  MailboxConnection,
  | "id"
  | "email"
  | "imap_host"
  | "imap_port"
  | "imap_username"
  | "sent_folder"
  | "sync_enabled"
  | "last_sync_at"
  | "last_sync_error"
>;

export function MailboxConnectionCard() {
  const language = useAppLanguage();
  const it = language === "it";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [encryptionConfigured, setEncryptionConfigured] = useState(true);
  const [connection, setConnection] = useState<MailboxConnectionSummary | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [imapHost, setImapHost] = useState(DEFAULT_IMAP_HOST);
  const [imapUsername, setImapUsername] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [sentFolder, setSentFolder] = useState(DEFAULT_SENT_FOLDER);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mailbox");
      const payload = await readJsonResponse<{
        connected?: boolean;
        encryptionConfigured?: boolean;
        connection?: MailboxConnectionSummary | null;
        error?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Impossibile caricare lo stato della casella mail.");
      }
      setConnected(Boolean(payload.connected));
      setEncryptionConfigured(payload.encryptionConfigured !== false);
      setConnection(payload.connection ?? null);
      if (payload.connection) {
        setEmail(payload.connection.email);
        setImapHost(payload.connection.imap_host || DEFAULT_IMAP_HOST);
        setImapUsername(payload.connection.imap_username);
        setSentFolder(payload.connection.sent_folder);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Impossibile caricare la casella mail"
            : "Unable to load mailbox status"
      );
    } finally {
      setLoading(false);
    }
  }, [it]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          imapHost,
          imapUsername: imapUsername || email,
          imapPassword,
          sentFolder,
        }),
      });
      const payload = await readJsonResponse<{
        error?: string;
        connection?: MailboxConnectionSummary;
      }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Connection failed");
      }
      setConnected(true);
      setConnection(payload.connection ?? null);
      setImapPassword("");
      toast.success(it ? "Casella IMAP collegata" : "IMAP mailbox connected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Collegamento fallito"
            : "Connection failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/mailbox/sync", { method: "POST" });
      const payload = await readJsonResponse<{
        error?: string;
        imported?: number;
        matched?: number;
      }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed");
      }
      toast.success(
        it
          ? `Sincronizzate ${payload.imported ?? 0} mail (${payload.matched ?? 0} assegnate)`
          : `Synced ${payload.imported ?? 0} emails (${payload.matched ?? 0} matched)`
      );
      await loadStatus();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Sincronizzazione fallita"
            : "Sync failed"
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/mailbox", { method: "DELETE" });
      const payload = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Disconnect failed");
      }
      setConnected(false);
      setConnection(null);
      setImapPassword("");
      toast.success(it ? "Casella scollegata" : "Mailbox disconnected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Scollegamento fallito"
            : "Disconnect failed"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {it ? "Caricamento casella mail..." : "Loading mailbox..."}
      </p>
    );
  }

  return (
    <SettingsSectionCard
      title={it ? "Casella mail IMAP" : "IMAP mailbox"}
      description={
        it
          ? "Collega la tua casella @andreaauletta.net (Interhost) per archiviare automaticamente le mail nei progetti."
          : "Connect your @andreaauletta.net mailbox (Interhost) to archive emails into projects automatically."
      }
    >
      {!encryptionConfigured ? (
        <p className="text-sm text-destructive">
          {it
            ? "Il server non ha MAILBOX_CREDENTIALS_SECRET configurato. Contatta l'amministratore."
            : "Server is missing MAILBOX_CREDENTIALS_SECRET. Contact your administrator."}
        </p>
      ) : null}

      {connected && connection ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Mail className="size-4" />
              {connection.email}
            </div>
            <p className="mt-2 text-muted-foreground">
              {it ? "Server" : "Server"}: {connection.imap_host}:{connection.imap_port}
            </p>
            <p className="text-muted-foreground">
              {it ? "Cartella inviata" : "Sent folder"}: {connection.sent_folder}
            </p>
            {connection.last_sync_at ? (
              <p className="text-muted-foreground">
                {it ? "Ultima sync" : "Last sync"}:{" "}
                {formatDateTime(connection.last_sync_at)}
              </p>
            ) : null}
            {connection.last_sync_error ? (
              <p className="mt-2 text-destructive">{connection.last_sync_error}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSync()} disabled={syncing}>
              {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {it ? "Sincronizza ora" : "Sync now"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDisconnect()}
              disabled={saving}
            >
              <Unplug />
              {it ? "Scollega" : "Disconnect"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SettingsField
            label={it ? "Indirizzo email" : "Email address"}
            htmlFor="mailbox-email"
          >
            <Input
              id="mailbox-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@andreaauletta.net"
            />
          </SettingsField>

          <SettingsField
            label={it ? "Server IMAP" : "IMAP server"}
            htmlFor="mailbox-imap-host"
            hint={it ? "Hosting Solutions / Interhost: imaps.interhost.it:993" : "Hosting Solutions / Interhost: imaps.interhost.it:993"}
          >
            <Input
              id="mailbox-imap-host"
              value={imapHost}
              onChange={(event) => setImapHost(event.target.value)}
              placeholder="imaps.interhost.it"
            />
          </SettingsField>

          <SettingsField
            label={it ? "Username IMAP" : "IMAP username"}
            htmlFor="mailbox-username"
            hint={it ? "Di solito coincide con l'email." : "Usually the same as your email."}
          >
            <Input
              id="mailbox-username"
              value={imapUsername}
              onChange={(event) => setImapUsername(event.target.value)}
              placeholder={email || "nome@andreaauletta.net"}
            />
          </SettingsField>

          <SettingsField
            label={it ? "Password IMAP" : "IMAP password"}
            htmlFor="mailbox-password"
          >
            <Input
              id="mailbox-password"
              type="password"
              value={imapPassword}
              onChange={(event) => setImapPassword(event.target.value)}
            />
          </SettingsField>

          <SettingsField
            label={it ? "Cartella inviata" : "Sent folder"}
            htmlFor="mailbox-sent-folder"
            hint={
              it
                ? "Su Interhost di solito è INBOX.Sent oppure Sent."
                : "On Interhost this is usually INBOX.Sent or Sent."
            }
          >
            <Input
              id="mailbox-sent-folder"
              value={sentFolder}
              onChange={(event) => setSentFolder(event.target.value)}
            />
          </SettingsField>

          <Button
            type="button"
            onClick={() => void handleConnect()}
            disabled={saving || !email || !imapPassword}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Mail />}
            {it ? "Collega casella" : "Connect mailbox"}
          </Button>
        </div>
      )}
    </SettingsSectionCard>
  );
}
