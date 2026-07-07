import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Task, TaskStatus } from "@/types/database";

type ToggleTaskCompletionResult =
  | { ok: true; task: Task }
  | { ok: false; error: string };

interface ToggleTaskCompletionInput {
  supabase: SupabaseClient;
  workspaceId: string;
  taskId: string;
  projectId: string;
  title: string;
  completed: boolean;
}

export async function toggleTaskCompletion({
  supabase,
  workspaceId,
  taskId,
  projectId,
  title,
  completed,
}: ToggleTaskCompletionInput): Promise<ToggleTaskCompletionResult> {
  const status: TaskStatus = completed ? "done" : "todo";

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update task status",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "task.status_changed",
    entityType: "task",
    entityId: data.id,
    projectId,
    title,
    metadata: { status },
  });

  return { ok: true, task: data as Task };
}
