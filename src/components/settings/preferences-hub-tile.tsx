"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { transition } from "@/lib/animation";
import {
  patchPreferences,
  readPreferences,
  type AppLanguage,
  type AppTheme,
} from "@/lib/settings/preferences-storage";
import { useAppLanguage } from "@/lib/settings/language";
import { settingsSectionHref } from "@/lib/settings/constants";
import { settingsHubTileClass } from "@/lib/settings/hub-control-styles";
import { applyLanguage, applyTheme } from "@/lib/settings/theme";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AnimatedSegmentedControl } from "@/components/settings/animated-segmented-control";

const LANGUAGE_OPTIONS = {
  en: [
    { value: "en" as const, label: "English" },
    { value: "it" as const, label: "Italian" },
  ],
  it: [
    { value: "it" as const, label: "Italiano" },
    { value: "en" as const, label: "Inglese" },
  ],
} as const;

const THEME_OPTIONS = {
  en: [
    { value: "dark" as const, label: "Dark" },
    { value: "light" as const, label: "Light" },
    { value: "system" as const, label: "System" },
  ],
  it: [
    { value: "dark" as const, label: "Scuro" },
    { value: "light" as const, label: "Chiaro" },
    { value: "system" as const, label: "Sistema" },
  ],
} as const;

export function PreferencesHubTile() {
  const activeLanguage = useAppLanguage();
  const [language, setLanguage] = useState<AppLanguage>(
    () => readPreferences().language
  );
  const [theme, setTheme] = useState<AppTheme>(() => readPreferences().theme);

  const updateLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    const next = patchPreferences({ language: nextLanguage });
    applyLanguage(next.language);
  }, []);

  const updateTheme = useCallback((nextTheme: AppTheme) => {
    setTheme(nextTheme);
    const next = patchPreferences({ theme: nextTheme });
    applyTheme(next.theme);
  }, []);

  return (
    <Card
      data-dashboard-panel
      variant="nested"
      className={cn(settingsHubTileClass, "justify-between gap-5")}
    >
      <span className={textStyle.pageTitle}>
        {t(activeLanguage, "settings.preferences.label")}
      </span>

      <div className="flex flex-col gap-4">
        <AnimatedSegmentedControl
          value={language}
          options={[...LANGUAGE_OPTIONS[activeLanguage]]}
          onChange={updateLanguage}
          aria-label={t(activeLanguage, "settings.preferences.languageLabel")}
        />

        <AnimatedSegmentedControl
          value={theme}
          options={[...THEME_OPTIONS[activeLanguage]]}
          onChange={updateTheme}
          aria-label={t(activeLanguage, "settings.preferences.themeLabel")}
        />
      </div>

      <Link
        href={settingsSectionHref("preferences")}
        className={cn(
          textStyle.captionMedium,
          "text-muted-foreground",
          transition.hover,
          "hover:text-foreground"
        )}
      >
        {t(activeLanguage, "settings.preferences.managePreferences")}
      </Link>
    </Card>
  );
}
