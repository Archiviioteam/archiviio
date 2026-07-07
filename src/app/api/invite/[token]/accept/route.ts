import { NextResponse } from "next/server";
import { acceptWorkspaceInvitation } from "@/lib/invitations/workspace-invite";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function parseAcceptBody(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const email =
    "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password =
    "password" in body && typeof body.password === "string" ? body.password : "";

  return { email, password };
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Invitation service is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseAcceptBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await acceptWorkspaceInvitation(
    supabaseAdmin,
    token,
    parsed.email,
    parsed.password
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
