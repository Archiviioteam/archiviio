import dns from "node:dns";
import pg from "pg";

const PLACEHOLDER_VALUES = new Set([
  "your_supabase_project_url",
  "https://your-project-ref.supabase.co",
  "your_supabase_anon_key",
]);

export function configureDns() {
  if (process.env.SUPABASE_DNS_SERVERS?.trim()) {
    dns.setServers(
      process.env.SUPABASE_DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean)
    );
    return;
  }

  // Some local networks append a search domain that breaks Node DNS for FQDNs.
  dns.setServers(["8.8.8.8", "1.1.1.1", "192.168.1.1"]);
}

export function isLocalSupabaseUrl(url) {
  try {
    const { hostname, port } = new URL(url);
    return (
      (hostname === "127.0.0.1" || hostname === "localhost") &&
      (port === "54321" || port === "")
    );
  } catch {
    return false;
  }
}

export function getProjectRef(url) {
  if (isLocalSupabaseUrl(url)) return "local";

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL.");
  return match[1];
}

export function buildDatabaseUrlCandidates(projectRef, password) {
  const urls = [];

  if (process.env.DATABASE_URL?.trim()) {
    urls.push(process.env.DATABASE_URL.trim());
  }

  if (projectRef === "local") {
    urls.push("postgresql://postgres:postgres@127.0.0.1:54322/postgres");
    return [...new Set(urls)];
  }

  const dbPassword = password?.trim();
  if (!dbPassword) return urls;

  if (process.env.SUPABASE_DB_HOST?.trim()) {
    const host = process.env.SUPABASE_DB_HOST.trim();
    urls.push(
      `postgresql://postgres:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`
    );
  }

  const region = process.env.SUPABASE_DB_REGION?.trim() ?? "eu-north-1";
  const poolerPrefixes = [
    process.env.SUPABASE_POOLER_PREFIX?.trim(),
    "aws-1",
    "aws-0",
  ].filter(Boolean);

  for (const prefix of poolerPrefixes) {
    urls.push(
      `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${prefix}-${region}.pooler.supabase.com:5432/postgres`
    );
  }

  urls.push(
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`
  );

  return [...new Set(urls)];
}

export function createPgClient(databaseUrl, supabaseUrl) {
  const options = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 15_000,
  };

  if (!isLocalSupabaseUrl(supabaseUrl ?? "")) {
    options.ssl = { rejectUnauthorized: false };
  }

  return new pg.Client(options);
}

export async function connectDatabase({ projectRef, password, supabaseUrl }) {
  configureDns();
  const candidates = buildDatabaseUrlCandidates(projectRef, password);
  let lastError;

  for (const databaseUrl of candidates) {
    const client = createPgClient(databaseUrl, supabaseUrl);
    const hostLabel = databaseUrl.replace(/:[^:@]+@/, ":***@");

    try {
      await client.connect();
      return { client, databaseUrl };
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message.split("\n")[0] : String(error);
      console.error(`Database connection failed (${hostLabel}): ${message}`);
      try {
        await client.end();
      } catch {
        // ignore cleanup errors
      }
    }
  }

  throw lastError ?? new Error("Could not connect to database.");
}

export function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    throw new Error(`Missing or placeholder value for ${name}.`);
  }
  return value;
}
