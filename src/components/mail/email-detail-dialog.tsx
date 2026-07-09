"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  buildAppleMailOpenUrl,
  formatEmailAddress,
} from "@/lib/email/imap-constants";
import { formatDateTime } from "@/lib/date-format";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { ArchivedEmail } from "@/types/database";

interface EmailDetailDialogProps {
  email: ArchivedEmail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDetailDialog({
  email,
  open,
  onOpenChange,
}: EmailDetailDialogProps) {
  const language = useAppLanguage();
  const it = language === "it";
  const [loadingBody, setLoadingBody] = useState(false);
  const [body, setBody] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !email) {
      setBody(null);
      return;
    }

    if (email.body_text) {
      setBody(email.body_text);
      return;
    }

    let cancelled = false;
    setLoadingBody(true);

    void (async () => {
      try {
        const response = await fetch(`/api/archived-emails/${email.id}/body`);
        const payload = (await response.json()) as { body?: string; error?: string };
        if (!cancelled) {
          setBody(payload.body ?? "");
        }
      } finally {
        if (!cancelled) setLoadingBody(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, open]);

  if (!email) return null;

  const openUrl = buildAppleMailOpenUrl(email.message_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {email.subject || (it ? "(Senza oggetto)" : "(No subject)")}
          </DialogTitle>
          <DialogDescription>
            {formatDateTime(email.sent_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">{it ? "Da" : "From"}: </span>
            {formatEmailAddress(email.from_name, email.from_address)}
          </div>
          <div>
            <span className="font-medium">{it ? "A" : "To"}: </span>
            {email.to_addresses.join(", ") || "—"}
          </div>
          {email.cc_addresses.length > 0 ? (
            <div>
              <span className="font-medium">Cc: </span>
              {email.cc_addresses.join(", ")}
            </div>
          ) : null}
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border/60 bg-muted/10 p-4">
          {loadingBody ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {it ? "Caricamento contenuto..." : "Loading content..."}
            </div>
          ) : (
            <p className={cn(textStyle.body, "whitespace-pre-wrap break-words")}>
              {body || email.snippet || (it ? "Nessun contenuto disponibile." : "No content available.")}
            </p>
          )}
        </div>

        {openUrl ? (
          <Button type="button" variant="outline" asChild>
            <a href={openUrl}>
              <ExternalLink />
              {it ? "Apri in Mail" : "Open in Mail"}
            </a>
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
