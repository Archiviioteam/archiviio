const PLACEHOLDER_VALUES = new Set([
  "your_supabase_project_url",
  "https://your-project-ref.supabase.co",
  "your_supabase_anon_key",
]);

// Module-level constants so Next.js inlines them into the static desktop bundle.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function assertPublishableKey(value: string, name: string): string {
  if (value.startsWith("sb_secret_")) {
    throw new Error(
      `${name} must be the publishable (anon) key, not the secret key. In Supabase Dashboard → Project Settings → API, use "anon" / "publishable" (sb_publishable_… or eyJ…). Never put a secret key in NEXT_PUBLIC_* variables.`
    );
  }

  return value;
}

function assertRequiredEnv(value: string, name: string): string {
  const trimmed = value.trim();

  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) {
    throw new Error(
      `Missing ${name}. Copy .env.local.example to .env.local and add your Supabase credentials.`
    );
  }

  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    return assertPublishableKey(trimmed, name);
  }

  return trimmed;
}

export function getSupabaseEnv() {
  return {
    url: assertRequiredEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: assertRequiredEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
