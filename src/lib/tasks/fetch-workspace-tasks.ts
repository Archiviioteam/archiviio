import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { sortTasksByDueDate } from "@/lib/tasks/sort-tasks-by-due-date";
import type { Task } from "@/types/database";

export interface WorkspaceTask extends Task {
  projectName: string | null;
  projectCode: string | null;
}

type TaskRow = Task & {
  projects: { name: string; code: string } | { name: string; code: string }[] | null;
};

function relatedProject(
  value: { name: string; code: string } | { name: string; code: string }[] | null
): { name: string; code: string } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function formatTaskProjectLabel(task: {
  projectCode: string | null;
  projectName: string | null;
}): string | undefined {
  const code = task.projectCode
    ? formatProjectCodeDisplay(task.projectCode)
    : null;

  if (code && task.projectName) {
    return `${code} - ${task.projectName}`;
  }

  if (code) {
    return code;
  }

  return task.projectName ?? undefined;
}

export async function fetchWorkspaceTasks(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceTask[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*, projects(name, code)")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return sortTasksByDueDate(
    ((data as TaskRow[]) ?? []).map((row) => {
      const project = relatedProject(row.projects);

      return {
        ...row,
        projects: undefined,
        projectName: project?.name ?? null,
        projectCode: project?.code ?? null,
      } as WorkspaceTask;
    })
  );
}
