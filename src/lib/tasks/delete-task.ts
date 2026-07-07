import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";

type DeleteTaskResult = { ok: true } | { ok: false; error: string };

interface DeleteTaskInput {
  supabase: SupabaseClient;
  workspaceId: string;
  taskId: string;
  projectId: string;
  title: string;
}

export async function deleteTask({
  supabase,
  workspaceId,
  taskId,
  projectId,
  title,
}: DeleteTaskInput): Promise<DeleteTaskResult> {
  const activityLogged = await logActivity(supabase, {
    workspaceId,
    action: "task.deleted",
    entityType: "task",
    entityId: taskId,
    projectId,
    title,
  });

  if (!activityLogged) {
    return {
      ok: false,
      error: "Could not record this deletion in recent activity.",
    };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
