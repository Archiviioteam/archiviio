import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { formatAuthError } from "@/lib/supabase/format-error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseSignupBody(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const email =
    "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  const password =
    "password" in body && typeof body.password === "string" ? body.password : "";
  const workspaceName =
    "workspaceName" in body && typeof body.workspaceName === "string"
      ? body.workspaceName.trim()
      : "";

  return { email, password, workspaceName };
}

async function ensureWorkspaceForNewUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  email: string,
  workspaceName: string
): Promise<{ workspaceId: string } | { error: string }> {
  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from("users")
    .select("workspace_id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    return { error: existingProfileError.message };
  }

  const profile = existingProfile as { workspace_id: string } | null;

  if (profile?.workspace_id) {
    return { workspaceId: profile.workspace_id };
  }

  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .insert({ name: workspaceName } as never)
    .select("id")
    .single();

  const createdWorkspace = workspace as { id: string } | null;

  if (workspaceError || !createdWorkspace) {
    return {
      error: workspaceError?.message || "Failed to create workspace",
    };
  }

  const { error: profileError } = await supabaseAdmin.from("users").insert({
    id: userId,
    workspace_id: createdWorkspace.id,
    email,
    role: "owner",
  } as never);

  if (profileError) {
    return { error: profileError.message };
  }

  return { workspaceId: createdWorkspace.id };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseSignupBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, workspaceName } = parsed;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      {
        error:
          "Signup is not configured on the server. Add SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.",
      },
      { status: 503 }
    );
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const resolvedWorkspaceName = workspaceName || "My studio";

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      workspace_name: resolvedWorkspaceName,
    },
  });

  if (error) {
    return NextResponse.json({ error: formatAuthError(error) }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 }
    );
  }

  const workspaceResult = await ensureWorkspaceForNewUser(
    supabaseAdmin,
    data.user.id,
    email,
    resolvedWorkspaceName
  );

  if ("error" in workspaceResult) {
    return NextResponse.json({ error: workspaceResult.error }, { status: 500 });
  }

  return NextResponse.json({
    userId: data.user.id,
    workspaceId: workspaceResult.workspaceId,
  });
}
