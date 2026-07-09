import { NextResponse } from "next/server";
import { moveArchivedEmailToProject } from "@/lib/email/archived-emails";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface MoveEmailBody {
  projectId?: string | null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: MoveEmailBody;
  try {
    body = (await request.json()) as MoveEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const projectId =
    typeof body.projectId === "string" ? body.projectId : body.projectId ?? null;

  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
  }

  try {
    const email = await moveArchivedEmailToProject(supabase, id, projectId);
    return NextResponse.json({ email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move email";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
