import { useEffect, useState } from "react";
import {
  PREFERENCES_STORAGE_KEY,
  readPreferences,
  type AppLanguage,
} from "@/lib/settings/preferences-storage";

export const LANGUAGE_CHANGED_EVENT = "archiviio:language-change";

function isAppLanguage(value: string): value is AppLanguage {
  return value === "it" || value === "en";
}

export function readActiveLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{ language: unknown }>;
      if (isAppLanguage(String(parsed.language ?? ""))) {
        return parsed.language as AppLanguage;
      }
    }
  } catch {
    // Fall through to other language sources.
  }

  const preferencesLanguage = readPreferences().language;
  if (isAppLanguage(preferencesLanguage)) {
    return preferencesLanguage;
  }

  const documentLanguage = document.documentElement.lang;
  if (isAppLanguage(documentLanguage)) {
    return documentLanguage;
  }

  return "en";
}

export function useAppLanguage(): AppLanguage {
  const [language, setLanguage] = useState<AppLanguage>(() =>
    readActiveLanguage()
  );

  useEffect(() => {
    const syncLanguage = () => setLanguage(readActiveLanguage());
    const onLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<AppLanguage>).detail;
      if (isAppLanguage(detail)) {
        setLanguage(detail);
        return;
      }
      syncLanguage();
    };

    window.addEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChange);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChange);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  return language;
}
