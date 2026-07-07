import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import type { Task, TaskUrgency } from "@/types/database";

type CreateTaskResult =
  | { ok: true; task: Task }
  | { ok: false; error: string };

export interface CreateTaskInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  title: string;
  dueDate?: string | null;
  urgency?: TaskUrgency | null;
  notes?: string | null;
  reminderAt?: string | null;
}

export async function createTask({
  supabase,
  workspaceId,
  projectId,
  title,
  dueDate = null,
  urgency = null,
  notes = null,
  reminderAt = null,
}: CreateTaskInput): Promise<CreateTaskResult> {
  const trimmedTitle = title.trim();
  const trimmedNotes = notes?.trim() || null;

  if (!trimmedTitle) {
    return { ok: false, error: "Task name is required." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      title: trimmedTitle,
      status: "todo",
      due_date: dueDate || null,
      urgency: urgency || null,
      notes: trimmedNotes,
      reminder_at: reminderAt || null,
      tags: [],
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create task",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "task.created",
    entityType: "task",
    entityId: data.id,
    projectId,
    title: trimmedTitle,
  });

  return { ok: true, task: data as Task };
}
