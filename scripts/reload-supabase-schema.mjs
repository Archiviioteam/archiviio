import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Run: cp .env.local.example .env.local`);
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function getProjectRef(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL.");
  return match[1];
}

function buildDatabaseUrl(projectRef, password) {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  const dbPassword = password?.trim();
  if (!dbPassword) return null;

  if (process.env.SUPABASE_DB_HOST?.trim()) {
    const host = process.env.SUPABASE_DB_HOST.trim();
    return `postgresql://postgres:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`;
  }

  const region = process.env.SUPABASE_DB_REGION?.trim() ?? "eu-north-1";
  const poolerPrefix = process.env.SUPABASE_POOLER_PREFIX?.trim() ?? "aws-1";

  return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${poolerPrefix}-${region}.pooler.supabase.com:5432/postgres`;
}

async function main() {
  loadEnvFile(envPath);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  const projectRef = getProjectRef(url);
  const databaseUrl = buildDatabaseUrl(projectRef, process.env.SUPABASE_DB_PASSWORD);

  if (!databaseUrl) {
    throw new Error(
      "Missing SUPABASE_DB_PASSWORD or DATABASE_URL in .env.local."
    );
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query("notify pgrst, 'reload schema';");
    console.log("Supabase schema cache reload requested.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Schema reload failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
