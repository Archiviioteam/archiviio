import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER_VALUES = new Set([
  "your_supabase_project_url",
  "https://your-project-ref.supabase.co",
  "your_supabase_anon_key",
]);

export function loadEnvLocal(cwd = process.cwd()) {
  const envPath = join(cwd, ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    process.env[key] = value;
  }
}

export function requirePublicSupabaseEnv() {
  loadEnvLocal();

  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = requiredEnv.filter((key) => {
    const value = process.env[key]?.trim();

    return !value || PLACEHOLDER_VALUES.has(value);
  });

  if (missing.length > 0) {
    console.error(
      `Error: missing or placeholder values for ${missing.join(", ")}.`
    );
    console.error(
      "Copy .env.local.example to .env.local and add your Supabase credentials before building the desktop app."
    );
    process.exit(1);
  }
}
