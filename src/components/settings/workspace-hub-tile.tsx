"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { transition } from "@/lib/animation";
import { settingsSectionHref } from "@/lib/settings/constants";
import { settingsHubTileClass } from "@/lib/settings/hub-control-styles";
import { createClient } from "@/lib/supabase/client";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Workspace } from "@/types/database";

export function WorkspaceHubTile() {
  const language = useAppLanguage();
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("users")
        .select("workspace_id, workspaces(*)")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const workspace = profile?.workspaces
        ? (profile.workspaces as unknown as Workspace)
        : null;
      setWorkspaceName(workspace?.name ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card
      variant="nested"
      className={cn(settingsHubTileClass, "justify-between gap-5")}
    >
      <span className={textStyle.pageTitle}>{t(language, "settings.workspace.label")}</span>

      <div className="flex flex-col gap-2">
        <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
          {t(language, "workspace.name")}
        </p>
        <Input value={workspaceName} readOnly disabled />
      </div>

      <Link
        href={settingsSectionHref("workspace")}
        className={cn(
          textStyle.captionMedium,
          "text-muted-foreground",
          transition.hover,
          "hover:text-foreground"
        )}
      >
        {t(language, "workspace.manage")}
      </Link>
    </Card>
  );
}
