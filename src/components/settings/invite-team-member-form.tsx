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

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setSending(true);

      const supabase = createClient();
      const result = await inviteTeamMember(supabase, email);

      setSending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const invitedEmail = email.trim().toLowerCase();
      setEmail("");
      toast.success(
        result.emailed
          ? t(language, "team.invitationSent").replace("{email}", invitedEmail)
          : t(language, "team.invitationSaved").replace("{email}", invitedEmail)
      );
      onInvited?.(invitedEmail);
    },
    [email, language, onInvited]
  );

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
    </form>
  );
}
