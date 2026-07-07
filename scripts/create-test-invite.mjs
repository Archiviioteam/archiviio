import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, getProjectRef } from "./supabase-db-connect.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function makeToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

async function applyInvitationTokenFix() {
  const sql = readFileSync(
    resolve(projectRoot, "supabase/migrations/026_fix_invitation_token_generation.sql"),
    "utf8"
  );
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = getProjectRef(supabaseUrl);
  const { client } = await connectDatabase({
    projectRef,
    password: process.env.SUPABASE_DB_PASSWORD,
    supabaseUrl,
  });

  try {
    await client.query(sql);
    console.log("Applied 026_fix_invitation_token_generation.sql");
  } finally {
    await client.end();
  }
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const inviteEmail = process.argv[2]?.trim().toLowerCase() || "collega@example.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase env vars in .env.local");
  }

  try {
    await applyInvitationTokenFix();
  } catch (error) {
    console.warn("Migration apply warning:", error instanceof Error ? error.message : error);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: owner, error: ownerError } = await admin
    .from("users")
    .select("id, email, workspace_id, workspaces(name)")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (ownerError || !owner) {
    throw new Error(ownerError?.message || "No workspace owner found");
  }

  const workspace = Array.isArray(owner.workspaces)
    ? owner.workspaces[0]
    : owner.workspaces;
  const workspaceName = workspace?.name || "Workspace";
  const { data: existingInvite } = await admin
    .from("workspace_invitations")
    .select("email, token, status, workspaces(name)")
    .eq("workspace_id", owner.workspace_id)
    .eq("status", "pending")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInvite?.token) {
    const existingWorkspace = Array.isArray(existingInvite.workspaces)
      ? existingInvite.workspaces[0]
      : existingInvite.workspaces;
    const inviteUrl = `${siteUrl.replace(/\/$/, "")}/invite/${existingInvite.token}`;
    console.log(JSON.stringify({
      workspaceName: existingWorkspace?.name || workspaceName,
      inviteEmail: existingInvite.email,
      inviteUrl,
      ownerEmail: owner.email,
      reusedExisting: true,
    }, null, 2));
    return;
  }

  const token = makeToken();

  const { error: upsertError } = await admin.from("workspace_invitations").upsert(
    {
      workspace_id: owner.workspace_id,
      email: inviteEmail,
      invited_by: owner.id,
      status: "pending",
      token,
    },
    { onConflict: "workspace_id,email" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const inviteUrl = `${siteUrl.replace(/\/$/, "")}/invite/${token}`;

  console.log(JSON.stringify({
    workspaceName,
    inviteEmail,
    inviteUrl,
    ownerEmail: owner.email,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
