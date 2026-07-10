import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Task, TaskUrgency } from "@/types/database";

type UpdateTaskUrgencyResult =
  | { ok: true; task: Task }
  | { ok: false; error: string };

export interface UpdateTaskUrgencyInput {
  supabase: SupabaseClient;
  workspaceId: string;
  taskId: string;
  projectId: string;
  title: string;
  urgency: TaskUrgency | null;
}

export async function updateTaskUrgency({
  supabase,
  workspaceId,
  taskId,
  projectId,
  title,
  urgency,
}: UpdateTaskUrgencyInput): Promise<UpdateTaskUrgencyResult> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ urgency })
    .eq("id", taskId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update task urgency",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "task.updated",
    entityType: "task",
    entityId: data.id,
    projectId,
    title,
    metadata: { urgency },
  });

  return { ok: true, task: data as Task };
}
