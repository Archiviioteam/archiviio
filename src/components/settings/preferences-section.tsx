"use client";

import { useCallback, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  patchPreferences,
  readPreferences,
  type AppLanguage,
  type AppTheme,
  type UserPreferences,
} from "@/lib/settings/preferences-storage";
import { useAppLanguage } from "@/lib/settings/language";
import { applyLanguage, applyTheme } from "@/lib/settings/theme";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsOptionGroup } from "@/components/settings/settings-option-group";
import { SecuritySettingsCards } from "@/components/settings/security-section";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";

const LANGUAGE_OPTIONS = {
  en: [
    { value: "it" as const, label: "Italian" },
    { value: "en" as const, label: "English" },
  ],
  it: [
    { value: "it" as const, label: "Italiano" },
    { value: "en" as const, label: "Inglese" },
  ],
} as const;

const THEME_OPTIONS = {
  en: [
    { value: "light" as const, label: "Light" },
    { value: "dark" as const, label: "Dark" },
    { value: "system" as const, label: "System" },
  ],
  it: [
    { value: "light" as const, label: "Chiaro" },
    { value: "dark" as const, label: "Scuro" },
    { value: "system" as const, label: "Sistema" },
  ],
} as const;

export function PreferencesSection() {
  const language = useAppLanguage();
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readPreferences()
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((current) =>
        current ? { ...current, [key]: value } : current
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!preferences) return;

    setSaving(true);
    setSaved(false);

    const next = patchPreferences(preferences);
    applyTheme(next.theme);
    applyLanguage(next.language);

    setSaving(false);
    setSaved(true);
    toast.success(t(language, "settings.preferences.saved"));
    window.setTimeout(() => setSaved(false), 2000);
  }, [language, preferences]);

  const saveButtonLabel = saving
    ? t(language, "common.saving")
    : saved
      ? t(language, "common.saved")
      : t(language, "common.saveChanges");

  return (
    <div className="flex flex-col gap-6">
      <SettingsSectionCard
        title={t(language, "settings.preferences.generalTitle")}
        description={t(language, "settings.preferences.generalDescription")}
        footer={
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                {t(language, "common.saving")}
              </>
            ) : saved ? (
              <>
                <Check />
                {t(language, "common.saved")}
              </>
            ) : (
              t(language, "common.saveChanges")
            )}
          </Button>
        }
      >
        <SettingsField label={t(language, "settings.preferences.languageLabel")}>
          <SettingsOptionGroup<AppLanguage>
            value={preferences.language}
            options={[...LANGUAGE_OPTIONS[language]]}
            onChange={(value) => updatePreference("language", value)}
          />
        </SettingsField>

        <SettingsField label={t(language, "settings.preferences.themeLabel")}>
          <SettingsOptionGroup<AppTheme>
            value={preferences.theme}
            options={[...THEME_OPTIONS[language]]}
            onChange={(value) => updatePreference("theme", value)}
          />
        </SettingsField>
      </SettingsSectionCard>

      <SettingsSectionCard
        title={t(language, "settings.preferences.behavior")}
        description={t(language, "settings.preferences.behaviorDescription")}
        footer={
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saveButtonLabel}
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className={textStyle.bodyMedium}>
              {t(language, "settings.preferences.openDashboardOnStartup")}
            </p>
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {t(language, "settings.preferences.openDashboardOnStartupDescription")}
            </p>
          </div>
          <Switch
            checked={preferences.openDashboardOnStartup}
            onCheckedChange={(checked) =>
              updatePreference("openDashboardOnStartup", checked)
            }
            aria-label={t(language, "settings.preferences.openDashboardOnStartup")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className={textStyle.bodyMedium}>
              {t(language, "settings.preferences.enableTaskReminders")}
            </p>
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {t(language, "settings.preferences.enableTaskRemindersDescription")}
            </p>
          </div>
          <Switch
            checked={preferences.taskReminders}
            onCheckedChange={(checked) =>
              updatePreference("taskReminders", checked)
            }
            aria-label={t(language, "settings.preferences.enableTaskReminders")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className={textStyle.bodyMedium}>
              {t(language, "settings.preferences.enableProjectNotifications")}
            </p>
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {t(
                language,
                "settings.preferences.enableProjectNotificationsDescription"
              )}
            </p>
          </div>
          <Switch
            checked={preferences.projectNotifications}
            onCheckedChange={(checked) =>
              updatePreference("projectNotifications", checked)
            }
            aria-label={t(
              language,
              "settings.preferences.enableProjectNotifications"
            )}
          />
        </div>
      </SettingsSectionCard>

      <SecuritySettingsCards />
    </div>
  );
}
