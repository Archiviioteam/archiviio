import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");

const PLACEHOLDER_VALUES = new Set([
  "your_supabase_project_url",
  "https://your-project-ref.supabase.co",
  "your_supabase_anon_key",
]);

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${path}. Run: cp .env.local.example .env.local`
    );
  }

  const content = readFileSync(path, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value || PLACEHOLDER_VALUES.has(value)) {
    throw new Error(
      `Missing or placeholder value for ${name}. Update .env.local with your Supabase credentials.`
    );
  }

  if (
    name === "NEXT_PUBLIC_SUPABASE_ANON_KEY" &&
    value.startsWith("sb_secret_")
  ) {
    throw new Error(
      `${name} must be the publishable (anon) key, not the secret key. Dashboard → Project Settings → API → anon / publishable (sb_publishable_…).`
    );
  }

  return value;
}

async function testConnection() {
  loadEnvFile(envPath);

  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const supabase = createClient(url, anonKey);

  const { error: authError } = await supabase.auth.getSession();

  if (authError) {
    throw new Error(`Auth API failed: ${authError.message}`);
  }

  const { error: dbError } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true });

  if (dbError) {
    if (dbError.code === "PGRST205") {
      console.log("Connection OK (auth API reachable).");
      console.log(
        "Database schema not found yet. Run supabase/migrations/001_core_tables.sql in the SQL editor."
      );
      return;
    }

    throw new Error(`Database query failed: ${dbError.message}`);
  }

  console.log("Supabase connection OK.");
  console.log(`Project URL: ${url}`);
  console.log("Auth API: reachable");
  console.log("Database: reachable (workspaces table found)");
}

testConnection().catch((error) => {
  console.error("Supabase connection test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
