"use client";

import Link from "next/link";
import { transition } from "@/lib/animation";
import { settingsSectionHref } from "@/lib/settings/constants";
import { settingsHubTileClass } from "@/lib/settings/hub-control-styles";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { Card } from "@/components/ui/card";
import { InviteTeamMemberForm } from "@/components/settings/invite-team-member-form";

export function TeamHubTile() {
  const language = useAppLanguage();
  return (
    <Card
      variant="nested"
      className={cn(settingsHubTileClass, "justify-between gap-5")}
    >
      <span className={textStyle.pageTitle}>{t(language, "settings.team.label")}</span>

      <InviteTeamMemberForm compact />

      <Link
        href={settingsSectionHref("team")}
        className={cn(
          textStyle.captionMedium,
          "text-muted-foreground",
          transition.hover,
          "hover:text-foreground"
        )}
      >
        {t(language, "team.manage")}
      </Link>
    </Card>
  );
}
