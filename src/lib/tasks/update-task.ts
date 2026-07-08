import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Task, TaskUrgency } from "@/types/database";

type UpdateTaskResult =
  | { ok: true; task: Task }
  | { ok: false; error: string };

export interface UpdateTaskInput {
  supabase: SupabaseClient;
  workspaceId: string;
  taskId: string;
  projectId: string;
  title: string;
  dueDate?: string | null;
  urgency?: TaskUrgency | null;
  notes?: string | null;
}

export async function updateTask({
  supabase,
  workspaceId,
  taskId,
  projectId,
  title,
  dueDate = null,
  urgency = null,
  notes = null,
}: UpdateTaskInput): Promise<UpdateTaskResult> {
  const trimmedTitle = title.trim();
  const trimmedNotes = notes?.trim() || null;

  if (!trimmedTitle) {
    return { ok: false, error: "Task name is required." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: trimmedTitle,
      due_date: dueDate || null,
      urgency: urgency || null,
      notes: trimmedNotes,
    })
    .eq("id", taskId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update task",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "task.updated",
    entityType: "task",
    entityId: data.id,
    projectId,
    title: trimmedTitle,
  });

  return { ok: true, task: data as Task };
}
