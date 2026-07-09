"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmailList } from "@/components/mail/email-list";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatSyncSuccessMessage,
  getSyncErrorMessage,
  type MailboxSyncResult,
} from "@/lib/email/sync-feedback";
import { fetchApi } from "@/lib/http/fetch-api";
import { readJsonResponse } from "@/lib/http/read-json-response";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface MailboxStatus {
  connected: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  stats: {
    total: number;
    unassigned: number;
    assigned: number;
  } | null;
}

export function MailContent() {
  const language = useAppLanguage();
  const it = language === "it";
  const [status, setStatus] = useState<MailboxStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await fetchApi("/api/mailbox");
      const payload = await readJsonResponse<{
        connected?: boolean;
        connection?: {
          last_sync_at?: string | null;
          last_sync_error?: string | null;
        } | null;
        stats?: {
          total: number;
          unassigned: number;
          assigned: number;
        } | null;
      }>(response);

      setStatus({
        connected: Boolean(payload.connected),
        lastSyncAt: payload.connection?.last_sync_at ?? null,
        lastSyncError: payload.connection?.last_sync_error ?? null,
        stats: payload.stats ?? null,
      });
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSync = async () => {
    try {
      const response = await fetchApi("/api/mailbox/sync", { method: "POST" });
      const payload = await readJsonResponse<MailboxSyncResult & { error?: string }>(
        response
      );
      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed");
      }

      const syncError = getSyncErrorMessage(payload);
      if (syncError) {
        toast.error(syncError);
      } else {
        toast.success(formatSyncSuccessMessage(payload, it));
      }

      await loadStatus();
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Sincronizzazione fallita"
            : "Sync failed"
      );
    }
  };

  return (
    <PageLayout>
      <PageContent className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={cn(textStyle.pageTitle, "flex items-center gap-2")}>
              <Mail className="size-6" />
              {it ? "Mail generali" : "General mail"}
            </h1>
            <p className={cn(textStyle.body, "text-muted-foreground")}>
              {it
                ? "Solo le mail non ancora assegnate a un progetto. Le altre sono nel tab Mail di ogni progetto."
                : "Only emails not yet assigned to a project. Assigned ones appear in each project's Mail tab."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleSync()}>
              <RefreshCw />
              {it ? "Sincronizza" : "Sync"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/settings/profile">
                {it ? "Collega casella" : "Connect mailbox"}
              </Link>
            </Button>
          </div>
        </div>

        {!statusLoading && status ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              {!status.connected ? (
                <p>
                  {it
                    ? "Nessuna casella collegata. Vai in Impostazioni → Profilo per collegare IMAP, poi clicca Sincronizza."
                    : "No mailbox connected. Go to Settings → Profile to connect IMAP, then click Sync."}
                </p>
              ) : !status.lastSyncAt ? (
                <p>
                  {it
                    ? "Casella collegata ma non ancora sincronizzata. Clicca Sincronizza per importare le mail."
                    : "Mailbox connected but not synced yet. Click Sync to import emails."}
                </p>
              ) : status.stats && status.stats.assigned > 0 && status.stats.unassigned === 0 ? (
                <p>
                  {it
                    ? `${status.stats.assigned} mail sono già nei progetti. Questa pagina mostra solo quelle da assegnare manualmente.`
                    : `${status.stats.assigned} emails are already in projects. This page only shows unassigned ones.`}
                </p>
              ) : status.stats && status.stats.total === 0 ? (
                <p>
                  {it
                    ? "Ultima sincronizzazione completata ma nessuna mail importata. Controlla credenziali e cartella inviata (INBOX.Sent o Sent)."
                    : "Last sync completed but no emails were imported. Check credentials and sent folder (INBOX.Sent or Sent)."}
                </p>
              ) : null}
              {status.lastSyncError ? (
                <p className="mt-2 text-destructive">{status.lastSyncError}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <EmailList unassignedOnly showMoveAction />
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
