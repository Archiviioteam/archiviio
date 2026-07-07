import type {
  AppLanguage,
  AppTheme,
} from "@/lib/settings/preferences-storage";
import { LANGUAGE_CHANGED_EVENT } from "@/lib/settings/language";

const THEME_STORAGE_KEY = "theme";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolvedTheme(theme: AppTheme): "light" | "dark" {
  if (theme === "system") {
    return prefersDark() ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme(theme));
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function readStoredTheme(): AppTheme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

let systemListener: (() => void) | null = null;

export function watchSystemTheme(onChange: (theme: AppTheme) => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = () => {
    const current = readStoredTheme();
    if (current === "system") {
      applyTheme("system");
      onChange("system");
    }
  };

  if (systemListener) {
    media.removeEventListener("change", systemListener);
  }

  systemListener = handler;
  media.addEventListener("change", handler);

  return () => {
    media.removeEventListener("change", handler);
    if (systemListener === handler) {
      systemListener = null;
    }
  };
}

export function applyLanguage(language: AppLanguage): void {
  document.documentElement.lang = language;
  window.dispatchEvent(
    new CustomEvent<AppLanguage>(LANGUAGE_CHANGED_EVENT, {
      detail: language,
    })
  );
}
