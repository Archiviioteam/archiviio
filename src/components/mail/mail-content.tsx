"use client";

import Link from "next/link";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmailList } from "@/components/mail/email-list";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readJsonResponse } from "@/lib/http/read-json-response";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function MailContent() {
  const language = useAppLanguage();
  const it = language === "it";

  const handleSync = async () => {
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
          ? `Sincronizzate ${payload.imported ?? 0} mail`
          : `Synced ${payload.imported ?? 0} emails`
      );
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
                ? "Mail non assegnate a un progetto. Puoi spostarle manualmente."
                : "Emails not assigned to a project yet. Move them manually when needed."}
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

        <Card>
          <CardContent className="p-4 sm:p-6">
            <EmailList unassignedOnly showMoveAction />
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
