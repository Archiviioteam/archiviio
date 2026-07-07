export type AppLanguage = "it" | "en";
export type AppTheme = "light" | "dark" | "system";

export interface UserPreferences {
  language: AppLanguage;
  theme: AppTheme;
  openDashboardOnStartup: boolean;
  taskReminders: boolean;
  projectNotifications: boolean;
}

export const PREFERENCES_STORAGE_KEY = "archiviio:preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  language: "en",
  theme: "system",
  openDashboardOnStartup: true,
  taskReminders: true,
  projectNotifications: true,
};

export function readPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
}

export function patchPreferences(
  patch: Partial<UserPreferences>
): UserPreferences {
  const next = { ...readPreferences(), ...patch };
  writePreferences(next);
  return next;
}
