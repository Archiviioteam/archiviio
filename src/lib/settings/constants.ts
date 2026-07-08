import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { t } from "@/lib/i18n/translations";

/** Multi-user team collaboration is active. */
export const TEAM_FEATURES_ENABLED = true;

export type SettingsSectionId =
  | "profile"
  | "workspace"
  | "team"
  | "preferences";

const SETTINGS_SECTION_IDS: SettingsSectionId[] = [
  "profile",
  "workspace",
  "team",
  "preferences",
];

export const SETTINGS_SECTIONS = SETTINGS_SECTION_IDS.map((id) => ({ id }));

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.some((sectionId) => sectionId === value);
}

export function getSettingsSection(
  sectionId: SettingsSectionId,
  language: AppLanguage = "en"
): {
  id: SettingsSectionId;
  label: string;
  description: string;
  pageDescription: string;
} {
  if (sectionId === "profile") {
    return {
      id: sectionId,
      label: t(language, "settings.profile.label"),
      description: t(language, "settings.profile.description"),
      pageDescription: t(language, "settings.profile.pageDescription"),
    };
  }
  if (sectionId === "workspace") {
    return {
      id: sectionId,
      label: t(language, "settings.workspace.label"),
      description: t(language, "settings.workspace.description"),
      pageDescription: t(language, "settings.workspace.pageDescription"),
    };
  }
  if (sectionId === "team") {
    return {
      id: sectionId,
      label: t(language, "settings.team.label"),
      description: t(language, "settings.team.description"),
      pageDescription: t(language, "settings.team.pageDescription"),
    };
  }
  return {
    id: sectionId,
    label: t(language, "settings.preferences.label"),
    description: t(language, "settings.preferences.description"),
    pageDescription: t(language, "settings.preferences.pageDescription"),
  };
}

export function settingsSectionHref(sectionId: SettingsSectionId): string {
  return `/settings/${sectionId}`;
}
