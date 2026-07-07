"use client";

import { useEffect } from "react";
import { readPreferences } from "@/lib/settings/preferences-storage";
import {
  applyLanguage,
  applyTheme,
  watchSystemTheme,
} from "@/lib/settings/theme";

export function PreferencesInitializer() {
  useEffect(() => {
    const preferences = readPreferences();
    applyTheme(preferences.theme);
    applyLanguage(preferences.language);

    return watchSystemTheme(() => {
      const current = readPreferences();
      if (current.theme === "system") {
        applyTheme("system");
      }
    });
  }, []);

  return null;
}
