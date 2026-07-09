import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  connectDatabase,
  createPgClient,
  getProjectRef,
  getRequiredEnv,
} from "./supabase-db-connect.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");
const migrationsDir = resolve(projectRoot, "supabase/migrations");

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

function listMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => /^\d{3}_.*\.sql$/.test(name))
    .sort();
}

async function pgColumnExists(client, table, column) {
  const { rows } = await client.query(
    `select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = $2
    ) as exists`,
    [table, column]
  );

  return rows[0]?.exists === true;
}

async function pgTableExists(client, table) {
  const { rows } = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
    ) as exists`,
    [table]
  );

  return rows[0]?.exists === true;
}

async function pgColumnDefaultIncludes(client, table, column, fragment) {
  const { rows } = await client.query(
    `select column_default
     from information_schema.columns
     where table_schema = 'public'
       and table_name = $1
       and column_name = $2`,
    [table, column]
  );
  const value = rows[0]?.column_default ?? "";
  return value.includes(fragment);
}

async function pgFunctionExists(client, functionName) {
  const { rows } = await client.query(
    `select exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = $1
    ) as exists`,
    [functionName]
  );

  return rows[0]?.exists === true;
}

async function checkSchemaViaPg(client) {
  const coreReady = await pgTableExists(client, "workspaces");

  if (!coreReady) {
    return { coreReady: false };
  }

  return {
    coreReady: true,
    location: await pgColumnExists(client, "projects", "location"),
    activity_events: await pgTableExists(client, "activity_events"),
    task_details:
      (await pgColumnExists(client, "tasks", "notes")) &&
      (await pgColumnExists(client, "tasks", "urgency")),
    reminder_removed: !(await pgColumnExists(client, "tasks", "reminder_at")),
    contact_type: await pgColumnExists(client, "contacts", "type"),
    project_contacts: await pgTableExists(client, "project_contacts"),
    workspace_nomenclature_rules: await pgTableExists(
      client,
      "workspace_nomenclature_rules"
    ),
    supplier_details:
      (await pgColumnExists(client, "suppliers", "company")) &&
      (await pgColumnExists(client, "suppliers", "company_types")),
    supplier_material_library: await pgColumnExists(
      client,
      "suppliers",
      "in_material_library"
    ),
    project_suppliers: await pgTableExists(client, "project_suppliers"),
    workspace_notes: await pgTableExists(client, "workspace_notes"),
    workspace_settings:
      (await pgColumnExists(client, "workspaces", "address")) &&
      (await pgColumnExists(client, "workspaces", "logo_url")),
    workspace_postal_code: await pgColumnExists(client, "workspaces", "postal_code"),
    email_archiving: await pgTableExists(client, "archived_emails"),
    interhost_imap_default: await pgColumnDefaultIncludes(
      client,
      "mailbox_connections",
      "imap_host",
      "interhost"
    ),
    user_profile_settings:
      (await pgColumnExists(client, "users", "first_name")) &&
      (await pgColumnExists(client, "users", "avatar_url")),
    workspace_invitations: await pgTableExists(client, "workspace_invitations"),
    workspace_invitation_tokens: await pgColumnExists(
      client,
      "workspace_invitations",
      "token"
    ),
    invitation_token_function: await pgFunctionExists(client, "new_invitation_token"),
    documents_bucket: await client
      .query(
        `select exists (
          select 1 from storage.buckets where id = 'documents'
        ) as exists`
      )
      .then(({ rows }) => rows[0]?.exists === true),
    workspace_assets_bucket: await client
      .query(
        `select exists (
          select 1 from storage.buckets where id = 'workspace-assets'
        ) as exists`
      )
      .then(({ rows }) => rows[0]?.exists === true),
  };
}

async function checkSchemaViaApi(supabase) {
  const checks = {
    location: async () => {
      const { error } = await supabase
        .from("projects")
        .select("location")
        .limit(0);
      return !error;
    },
    activity_events: async () => {
      const { error } = await supabase
        .from("activity_events")
        .select("id")
        .limit(0);
      return !error;
    },
    task_details: async () => {
      const { error } = await supabase
        .from("tasks")
        .select("notes, urgency")
        .limit(0);
      return !error;
    },
    reminder_removed: async () => {
      const { error } = await supabase.from("tasks").select("reminder_at").limit(0);
      return Boolean(error);
    },
    contact_type: async () => {
      const { error } = await supabase.from("contacts").select("type").limit(0);
      return !error;
    },
    project_contacts: async () => {
      const { error } = await supabase
        .from("project_contacts")
        .select("id")
        .limit(0);
      return !error;
    },
    workspace_nomenclature_rules: async () => {
      const { error } = await supabase
        .from("workspace_nomenclature_rules")
        .select("id")
        .limit(0);
      return !error;
    },
    supplier_details: async () => {
      const { error } = await supabase
        .from("suppliers")
        .select("company, company_types, contact_name, website")
        .limit(0);
      return !error;
    },
    supplier_material_library: async () => {
      const { error } = await supabase
        .from("suppliers")
        .select("in_material_library")
        .limit(0);
      return !error;
    },
    project_suppliers: async () => {
      const { error } = await supabase
        .from("project_suppliers")
        .select("id")
        .limit(0);
      return !error;
    },
    workspace_notes: async () => {
      const { error } = await supabase
        .from("workspace_notes")
        .select("id")
        .limit(0);
      return !error;
    },
    workspace_settings: async () => {
      const { error } = await supabase
        .from("workspaces")
        .select("address, city, country, email, phone, website, code, logo_url")
        .limit(0);
      return !error;
    },
    workspace_postal_code: async () => {
      const { error } = await supabase
        .from("workspaces")
        .select("postal_code")
        .limit(0);
      return !error;
    },
    user_profile_settings: async () => {
      const { error } = await supabase
        .from("users")
        .select("first_name, last_name, phone, bio, avatar_url")
        .limit(0);
      return !error;
    },
    workspace_invitations: async () => {
      const { error } = await supabase
        .from("workspace_invitations")
        .select("id")
        .limit(0);
      return !error;
    },
    workspace_invitation_tokens: async () => {
      const { error } = await supabase
        .from("workspace_invitations")
        .select("token")
        .limit(0);
      return !error;
    },
    invitation_token_function: async () => {
      const { data, error } = await supabase.rpc("new_invitation_token");
      return !error && typeof data === "string" && data.length > 0;
    },
    email_archiving: async () => {
      const { error } = await supabase
        .from("archived_emails")
        .select("id")
        .limit(0);
      return !error;
    },
  };

  const status = { coreReady: true };
  for (const [name, fn] of Object.entries(checks)) {
    status[name] = await fn();
  }
  return status;
}

function migrationsForStatus(status) {
  const files = listMigrationFiles();
  const needed = new Set();

  if (!status.coreReady) {
    return files;
  }

  if (!status.location) needed.add("013_project_location.sql");
  if (!status.activity_events) needed.add("014_activity_events.sql");
  if (!status.task_details) needed.add("015_task_details.sql");
  if (!status.contact_type) needed.add("016_contact_type.sql");
  if (!status.project_contacts) needed.add("017_project_contacts.sql");
  if (!status.workspace_nomenclature_rules) {
    needed.add("018_workspace_nomenclature_rules.sql");
  }
  if (!status.supplier_details) needed.add("019_supplier_details.sql");
  if (!status.supplier_material_library) {
    needed.add("028_supplier_material_library.sql");
  }
  if (!status.project_suppliers) needed.add("020_project_suppliers.sql");
  if (!status.workspace_notes) needed.add("021_workspace_notes.sql");
  if (!status.workspace_settings || !status.user_profile_settings) {
    needed.add("022_user_workspace_settings.sql");
  }
  if (!status.workspace_postal_code) {
    needed.add("030_workspace_postal_code.sql");
  }
  if (!status.workspace_invitations) needed.add("023_workspace_invitations.sql");
  if (!status.workspace_invitation_tokens) {
    needed.add("025_workspace_invitation_tokens.sql");
  }
  if (!status.invitation_token_function) {
    needed.add("026_fix_invitation_token_generation.sql");
  }
  if (!status.reminder_removed) needed.add("027_remove_task_reminder.sql");
  if (!status.email_archiving) needed.add("031_email_archiving.sql");
  if (!status.interhost_imap_default) needed.add("032_interhost_imap_default.sql");

  return files.filter((file) => needed.has(file));
}

async function reloadPostgrestSchema(databaseUrl, supabaseUrl) {
  const client = createPgClient(databaseUrl, supabaseUrl);

  await client.connect();

  try {
    await client.query("notify pgrst, 'reload schema';");
  } finally {
    await client.end();
  }
}

async function applyWithPg(databaseUrl, supabaseUrl, migrationFiles) {
  const client = createPgClient(databaseUrl, supabaseUrl);

  await client.connect();

  try {
    for (const file of migrationFiles) {
      const sql = readFileSync(resolve(migrationsDir, file), "utf8");
      console.log(`Applying ${file}...`);
      await client.query(sql);
      console.log(`Applied ${file}`);
    }

    await client.query("notify pgrst, 'reload schema';");
  } finally {
    await client.end();
  }
}

function printManualInstructions(projectRef, migrationFiles) {
  if (projectRef === "local") {
    console.log("\nPending migrations detected. Apply them locally:");
    console.log("npm run db:local:reset");
    console.log("\nOr paste and run these files in Supabase Studio (http://127.0.0.1:54323):\n");
  } else {
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

    console.log("\nPending migrations detected. Apply them in Supabase SQL Editor:");
    console.log(sqlEditorUrl);
    console.log("\nPaste and run these files in order:\n");
  }

  for (const file of migrationFiles) {
    console.log(`- supabase/migrations/${file}`);
  }

  console.log(
    "\nOr add SUPABASE_DB_PASSWORD (or DATABASE_URL) to .env.local and run:"
  );
  console.log("npm run db:migrate");
}

async function main() {
  loadEnvFile(envPath);

  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const projectRef = getProjectRef(url);
  const databasePassword = process.env.SUPABASE_DB_PASSWORD;

  let databaseUrl = null;
  let status = null;

  if (databasePassword || process.env.DATABASE_URL?.trim()) {
    const connection = await connectDatabase({
      projectRef,
      password: databasePassword,
      supabaseUrl: url,
    });

    databaseUrl = connection.databaseUrl;
    status = await checkSchemaViaPg(connection.client);
    await connection.client.end();
    console.log(`Connected to database (${projectRef}).`);
  } else {
    const supabase = createClient(url, anonKey);
    status = await checkSchemaViaApi(supabase);
  }

  const migrationFiles = migrationsForStatus(status);

  if (migrationFiles.length === 0) {
    if (databaseUrl) {
      await reloadPostgrestSchema(databaseUrl, url);
      console.log("Database schema is up to date. Refreshed API schema cache.");
    } else {
      console.log("Database schema is up to date.");
    }
    return;
  }

  if (!databaseUrl) {
    printManualInstructions(projectRef, migrationFiles);
    process.exit(1);
  }

  console.log(
    migrationFiles.length === listMigrationFiles().length
      ? "Fresh database detected — applying full schema."
      : `Applying ${migrationFiles.length} pending migration(s).`
  );

  try {
    await applyWithPg(databaseUrl, url, migrationFiles);
  } catch (error) {
    if (error instanceof Error && /password authentication failed/i.test(error.message)) {
      console.error("Database password rejected. Reset it in Supabase:");
      console.error(
        `https://supabase.com/dashboard/project/${projectRef}/settings/database`
      );
      console.error("Then update SUPABASE_DB_PASSWORD in .env.local and retry.");
    }

    throw error;
  }

  const verifyConnection = await connectDatabase({
    projectRef,
    password: databasePassword,
    supabaseUrl: url,
  });

  const updated = await checkSchemaViaPg(verifyConnection.client);
  await verifyConnection.client.end();

  const stillPending = migrationsForStatus(updated).filter(
    (file) => file !== "024_api_grants.sql"
  );

  if (stillPending.length > 0) {
    console.error("Some migrations may not have applied correctly.");
    printManualInstructions(projectRef, stillPending);
    process.exit(1);
  }

  console.log("Migrations applied successfully.");
}

main().catch((error) => {
  console.error("Migration failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
