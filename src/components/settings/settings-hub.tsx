"use client";

import Link from "next/link";
import {
  dashboardGridClass,
} from "@/lib/dashboard-layout";
import {
  SETTINGS_SECTIONS,
  getSettingsSection,
  settingsSectionHref,
} from "@/lib/settings/constants";
import { useAppLanguage } from "@/lib/settings/language";
import { settingsHubTileClass } from "@/lib/settings/hub-control-styles";
import { textStyle } from "@/lib/typography";
import { PreferencesHubTile } from "@/components/settings/preferences-hub-tile";
import { ProfileHubTile } from "@/components/settings/profile-hub-tile";
import { TeamHubTile } from "@/components/settings/team-hub-tile";
import { WorkspaceHubTile } from "@/components/settings/workspace-hub-tile";

export function SettingsHub() {
  const language = useAppLanguage();
  return (
    <div className={dashboardGridClass}>
      {SETTINGS_SECTIONS.map((section) => {
        const sectionContent = getSettingsSection(section.id, language);
        if (section.id === "team") {
          return <TeamHubTile key={section.id} />;
        }

        if (section.id === "preferences") {
          return <PreferencesHubTile key={section.id} />;
        }

        if (section.id === "profile") {
          return <ProfileHubTile key={section.id} />;
        }

        if (section.id === "workspace") {
          return <WorkspaceHubTile key={section.id} />;
        }

        return (
          <Link
            key={section.id}
            href={settingsSectionHref(section.id)}
            className={settingsHubTileClass}
          >
            <span className={textStyle.pageTitle}>{sectionContent.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
