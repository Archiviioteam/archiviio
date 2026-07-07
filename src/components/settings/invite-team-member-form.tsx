"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { inviteTeamMember } from "@/lib/settings/invite-team-member";
import {
  settingsHubPillButtonClass,
  settingsHubPillFieldClass,
} from "@/lib/settings/hub-control-styles";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteTeamMemberFormProps {
  compact?: boolean;
  className?: string;
  onInvited?: (email: string) => void;
}

export function InviteTeamMemberForm({
  compact = false,
  className,
  onInvited,
}: InviteTeamMemberFormProps) {
  const language = useAppLanguage();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setSending(true);
      setLastInviteUrl(null);

      const supabase = createClient();
      const result = await inviteTeamMember(supabase, email);

      setSending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const invitedEmail = email.trim().toLowerCase();
      setEmail("");

      if (result.inviteUrl) {
        setLastInviteUrl(result.inviteUrl);
      }

      if (result.emailed) {
        toast.success(
          t(language, "team.invitationSent").replace("{email}", invitedEmail)
        );
      } else if (result.inviteUrl) {
        try {
          await navigator.clipboard.writeText(result.inviteUrl);
          toast.success(
            t(language, "team.invitationLinkCopied").replace("{email}", invitedEmail)
          );
        } catch {
          toast.success(
            t(language, "team.invitationLinkReady").replace("{email}", invitedEmail)
          );
        }
      } else {
        toast.success(
          t(language, "team.invitationSaved").replace("{email}", invitedEmail)
        );
      }
      onInvited?.(invitedEmail);
    },
    [email, language, onInvited]
  );

  const handleCopyLink = useCallback(async () => {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      toast.success(t(language, "team.invitationLinkCopied").replace("{email}", ""));
    } catch {
      toast.error(t(language, "team.invitationLinkReady").replace("{email}", ""));
    }
  }, [language, lastInviteUrl]);

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      onClick={(event) => event.stopPropagation()}
      className={cn("flex w-full flex-col gap-3", className)}
    >
      {!compact ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "team.inviteHint")}
        </p>
      ) : null}

      <div className={cn("flex w-full gap-2", compact ? "flex-col" : "flex-col sm:flex-row")}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="colleague@studio.com"
          autoComplete="email"
          disabled={sending}
          aria-label={t(language, "team.inviteeEmail")}
          className={compact ? settingsHubPillFieldClass : undefined}
        />
        <Button
          type="submit"
          disabled={sending || email.trim().length === 0}
          className={compact ? cn(settingsHubPillButtonClass, "w-full") : "shrink-0"}
        >
          {sending ? (
            <>
              <Loader2 className="animate-spin" />
              {t(language, "team.sending")}
            </>
          ) : (
            t(language, "team.inviteByEmail")
          )}
        </Button>
      </div>

      {lastInviteUrl ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <p className={cn(textStyle.caption, "text-muted-foreground")}>
            {t(language, "team.invitationLinkReady").replace("{email}", "")}
          </p>
          <p className="break-all font-mono text-xs text-foreground">{lastInviteUrl}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyLink()}>
            {t(language, "team.copyInviteLink")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
