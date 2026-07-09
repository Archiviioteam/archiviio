import dns from "node:dns";
import pg from "pg";

function configureDns() {
  if (process.env.SUPABASE_DNS_SERVERS?.trim()) {
    dns.setServers(
      process.env.SUPABASE_DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean)
    );
    return;
  }

  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

function isLocalSupabaseUrl(url: string) {
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

function getProjectRef(url: string) {
  if (isLocalSupabaseUrl(url)) return "local";

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL.");
  return match[1];
}

function buildDatabaseUrlCandidates(projectRef: string, password?: string) {
  const urls: string[] = [];

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
  ].filter(Boolean) as string[];

  for (const prefix of poolerPrefixes) {
    for (const port of [5432, 6543]) {
      urls.push(
        `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${prefix}-${region}.pooler.supabase.com:${port}/postgres`
      );
    }
  }

  urls.push(
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`
  );

  return [...new Set(urls)];
}

function createPgClient(databaseUrl: string, supabaseUrl: string) {
  const options: pg.ClientConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 15_000,
  };

  if (!isLocalSupabaseUrl(supabaseUrl)) {
    options.ssl = { rejectUnauthorized: false };
  }

  return new pg.Client(options);
}

export async function withDatabaseConnection<T>(
  fn: (client: pg.Client) => Promise<T>
): Promise<T> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!password && !process.env.DATABASE_URL?.trim()) {
    throw new Error("Missing SUPABASE_DB_PASSWORD or DATABASE_URL.");
  }

  configureDns();
  const projectRef = getProjectRef(supabaseUrl);
  const candidates = buildDatabaseUrlCandidates(projectRef, password);
  let lastError: unknown;

  for (const databaseUrl of candidates) {
    const client = createPgClient(databaseUrl, supabaseUrl);

    try {
      await client.connect();
      try {
        return await fn(client);
      } finally {
        await client.end();
      }
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        // ignore cleanup errors
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not connect to database.");
}
