"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { transition } from "@/lib/animation";
import { settingsSectionHref } from "@/lib/settings/constants";
import { settingsHubTileClass } from "@/lib/settings/hub-control-styles";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MemberRole, User } from "@/types/database";

type ProfileSummary = {
  firstName: string;
  lastName: string;
  email: string;
  profession: string;
};

function roleLabel(role: MemberRole): string {
  return role === "owner" ? "Owner" : "Member";
}

export function ProfileHubTile() {
  const language = useAppLanguage();
  const [profile, setProfile] = useState<ProfileSummary>({
    firstName: "",
    lastName: "",
    email: "",
    profession: "",
  });

  const hasData = useMemo(
    () =>
      Boolean(
        profile.firstName || profile.lastName || profile.email || profile.profession
      ),
    [profile]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data } = await supabase
        .from("users")
        .select("first_name,last_name,email,role")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const typed = data as Pick<User, "first_name" | "last_name" | "email" | "role"> | null;
      setProfile({
        firstName: typed?.first_name ?? "",
        lastName: typed?.last_name ?? "",
        email: typed?.email ?? user.email ?? "",
        profession: typed?.role ? roleLabel(typed.role) : "",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card
      data-dashboard-panel
      variant="nested"
      className={cn(settingsHubTileClass, "justify-between gap-5")}
    >
      <span className={textStyle.pageTitle}>{t(language, "settings.profile.label")}</span>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
            {t(language, "profile.firstName")}
          </p>
          <Input value={profile.firstName} readOnly disabled />
        </div>
        <div className="flex flex-col gap-2">
          <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
            {t(language, "profile.lastName")}
          </p>
          <Input value={profile.lastName} readOnly disabled />
        </div>
        <div className="flex flex-col gap-2">
          <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
            {t(language, "profile.email")}
          </p>
          <Input value={profile.email} readOnly disabled />
        </div>
        <div className="flex flex-col gap-2">
          <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
            {t(language, "profile.profession")}
          </p>
          <Input value={profile.profession} readOnly disabled />
        </div>
      </div>

      {!hasData ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "profile.detailsPlaceholder")}
        </p>
      ) : null}

      <Link
        href={settingsSectionHref("profile")}
        className={cn(
          textStyle.captionMedium,
          "text-muted-foreground",
          transition.hover,
          "hover:text-foreground"
        )}
      >
        {t(language, "profile.manage")}
      </Link>
    </Card>
  );
}
