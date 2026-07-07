import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Project } from "@/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteProject(
  supabase: SupabaseClient,
  project: Project
): Promise<ActionResult> {
  const activityLogged = await logActivity(supabase, {
    workspaceId: project.workspace_id,
    action: "project.deleted",
    entityType: "project",
    entityId: project.id,
    projectId: project.id,
    title: project.name,
    metadata: { project_code: project.code },
  });

  if (!activityLogged) {
    return {
      ok: false,
      error: "Could not record this deletion in recent activity.",
    };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", project.id)
    .eq("workspace_id", project.workspace_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
