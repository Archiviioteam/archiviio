"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FolderInput,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { EmailDetailDialog } from "@/components/mail/email-detail-dialog";
import { MoveEmailDialog } from "@/components/mail/move-email-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildAppleMailOpenUrl, formatEmailAddress } from "@/lib/email/imap-constants";
import { fetchArchivedEmails } from "@/lib/email/archived-emails";
import { settingsHubActiveToggleClass } from "@/lib/settings/hub-control-styles";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { formatDateTime } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import type { ArchivedEmail, EmailDirection } from "@/types/database";

interface EmailListProps {
  projectId?: string;
  unassignedOnly?: boolean;
  showMoveAction?: boolean;
}

function formatSentAt(value: string): string {
  return formatDateTime(value);
}

export function EmailList({
  projectId,
  unassignedOnly = false,
  showMoveAction = false,
}: EmailListProps) {
  const language = useAppLanguage();
  const it = language === "it";
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<EmailDirection>("inbound");
  const [emails, setEmails] = useState<ArchivedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ArchivedEmail | null>(null);
  const [moveEmail, setMoveEmail] = useState<ArchivedEmail | null>(null);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);
    if (!workspaceId) {
      setEmails([]);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchArchivedEmails(supabase, {
        workspaceId,
        projectId,
        unassignedOnly,
        direction,
        limit: 200,
      });
      setEmails(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Impossibile caricare le mail"
            : "Failed to load emails"
      );
    } finally {
      setLoading(false);
    }
  }, [direction, it, projectId, unassignedOnly]);

  useEffect(() => {
    void loadEmails();
  }, [loadEmails]);

  const handleMoved = useCallback(
    (updated: ArchivedEmail) => {
      setEmails((current) =>
        unassignedOnly || !projectId
          ? current.filter((email) => email.id !== updated.id)
          : current.map((email) => (email.id === updated.id ? updated : email))
      );
      setMoveEmail(null);
      toast.success(it ? "Mail spostata" : "Email moved");
    },
    [it, projectId, unassignedOnly]
  );

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {it ? "Caricamento mail..." : "Loading emails..."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={direction === "inbound" ? "default" : "outline"}
          className={cn(direction === "inbound" && settingsHubActiveToggleClass)}
          onClick={() => setDirection("inbound")}
        >
          <ArrowDownLeft />
          {it ? "Ricevute" : "Inbox"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={direction === "outbound" ? "default" : "outline"}
          className={cn(direction === "outbound" && settingsHubActiveToggleClass)}
          onClick={() => setDirection("outbound")}
        >
          <ArrowUpRight />
          {it ? "Inviate" : "Sent"}
        </Button>
      </div>

      {emails.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              title={
                direction === "inbound"
                  ? it
                    ? "Nessuna mail ricevuta"
                    : "No received emails"
                  : it
                    ? "Nessuna mail inviata"
                    : "No sent emails"
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {emails.map((email) => {
            const openUrl = buildAppleMailOpenUrl(email.message_id);
            const counterpart =
              email.direction === "inbound"
                ? formatEmailAddress(email.from_name, email.from_address)
                : email.to_addresses.join(", ");

            return (
              <Card
                key={email.id}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => setSelectedEmail(email)}
              >
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={cn(textStyle.bodyMedium, "truncate")}>
                        {email.subject || (it ? "(Senza oggetto)" : "(No subject)")}
                      </p>
                      <p className={cn(textStyle.caption, "truncate text-muted-foreground")}>
                        {counterpart}
                      </p>
                    </div>
                    <span className={cn(textStyle.caption, "shrink-0 text-muted-foreground")}>
                      {formatSentAt(email.sent_at)}
                    </span>
                  </div>
                  {email.snippet ? (
                    <p className={cn(textStyle.caption, "line-clamp-2 text-muted-foreground")}>
                      {email.snippet}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    {openUrl ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={openUrl}>
                          <ExternalLink />
                          {it ? "Apri in Mail" : "Open in Mail"}
                        </a>
                      </Button>
                    ) : null}
                    {showMoveAction ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMoveEmail(email)}
                      >
                        <FolderInput />
                        {it ? "Sposta in progetto" : "Move to project"}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EmailDetailDialog
        email={selectedEmail}
        open={Boolean(selectedEmail)}
        onOpenChange={(open) => {
          if (!open) setSelectedEmail(null);
        }}
      />

      <MoveEmailDialog
        email={moveEmail}
        open={Boolean(moveEmail)}
        onOpenChange={(open) => {
          if (!open) setMoveEmail(null);
        }}
        onMoved={handleMoved}
      />
    </div>
  );
}
