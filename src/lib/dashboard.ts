import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchActivityFeed,
  formatActivityDate,
  type ActivityFeedItem,
} from "@/lib/activity";
import type { LastOpenedProjectSnapshot } from "@/lib/ai-command/last-opened-project-storage";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { projectHref } from "@/lib/search/search-routes";
import { compareTasksByPriorityAndDueDate } from "@/lib/tasks/sort-tasks-by-due-date";
import type { Project, TaskUrgency } from "@/types/database";

export const DASHBOARD_RECENT_PROJECTS_LIMIT = 5;
export const DASHBOARD_DEADLINES_LIMIT = 5;
export const DASHBOARD_DEADLINES_FETCH_LIMIT = 50;
export const DASHBOARD_ACTIVITY_LIMIT = 3;
export const COMMAND_CENTER_ACTIVITY_LIMIT = 5;
export interface DashboardDeadline {
  id: string;
  title: string;
  dueDate: string | null;
  projectName: string | null;
  projectCode: string | null;
  projectId: string | null;
  urgency: TaskUrgency | null;
}

export interface DashboardData {
  projects: Project[];
  deadlines: DashboardDeadline[];
  activity: ActivityFeedItem[];
}

type TaskDeadlineRow = {
  id: string;
  title: string;
  due_date: string | null;
  urgency: TaskUrgency | null;
  status: string;
  created_at: string;
  project_id: string | null;
  projects: { name: string; code: string } | { name: string; code: string }[] | null;
};

function relatedProject(
  value: { name: string; code: string } | { name: string; code: string }[] | null
): { name: string; code: string } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const formatDashboardDate = formatActivityDate;

export async function fetchCommandCenterActivity(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityFeedItem[]> {
  return fetchActivityFeed(supabase, workspaceId, {
    limit: COMMAND_CENTER_ACTIVITY_LIMIT,
  });
}

async function fetchRecentDashboardProjects(
  supabase: SupabaseClient,
  workspaceId: string,
  recentlyOpened: LastOpenedProjectSnapshot[]
): Promise<Project[]> {
  const orderedIds = recentlyOpened
    .slice(0, DASHBOARD_RECENT_PROJECTS_LIMIT)
    .map((project) => project.id);

  let projects: Project[] = [];

  if (orderedIds.length > 0) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("id", orderedIds);

    const projectsById = new Map(
      ((data as Project[]) ?? []).map((project) => [project.id, project])
    );

    projects = orderedIds
      .map((id) => projectsById.get(id))
      .filter((project): project is Project => project !== undefined);
  }

  if (projects.length < DASHBOARD_RECENT_PROJECTS_LIMIT) {
    const existingIds = projects.map((project) => project.id);
    let query = supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(DASHBOARD_RECENT_PROJECTS_LIMIT - projects.length);

    if (existingIds.length > 0) {
      query = query.not("id", "in", `(${existingIds.join(",")})`);
    }

    const { data: filler } = await query;
    projects = [...projects, ...((filler as Project[]) ?? [])];
  }

  return projects.slice(0, DASHBOARD_RECENT_PROJECTS_LIMIT);
}

export async function fetchDashboardData(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: {
    recentlyOpened?: LastOpenedProjectSnapshot[];
  }
): Promise<DashboardData> {
  const recentlyOpened = options?.recentlyOpened ?? [];

  const [projects, deadlinesResult, activity] = await Promise.all([
    fetchRecentDashboardProjects(supabase, workspaceId, recentlyOpened),
    supabase
      .from("tasks")
      .select("id, title, due_date, urgency, status, created_at, project_id, projects(name, code)")
      .eq("workspace_id", workspaceId)
      .neq("status", "done")
      .limit(DASHBOARD_DEADLINES_FETCH_LIMIT),
    fetchActivityFeed(supabase, workspaceId, {
      limit: DASHBOARD_ACTIVITY_LIMIT,
    }),
  ]);

  const deadlines: DashboardDeadline[] = (
    (deadlinesResult.data as TaskDeadlineRow[]) ?? []
  )
    .sort((a, b) =>
      compareTasksByPriorityAndDueDate(
        {
          due_date: a.due_date,
          created_at: a.created_at,
          urgency: a.urgency,
          status: a.status as "todo" | "in_progress" | "done",
        },
        {
          due_date: b.due_date,
          created_at: b.created_at,
          urgency: b.urgency,
          status: b.status as "todo" | "in_progress" | "done",
        }
      )
    )
    .slice(0, DASHBOARD_DEADLINES_LIMIT)
    .map((row) => {
      const project = relatedProject(row.projects);

      return {
        id: row.id,
        title: row.title,
        dueDate: row.due_date,
        projectName: project?.name ?? null,
        projectCode: project?.code ?? null,
        projectId: row.project_id,
        urgency: row.urgency,
      };
    });

  return {
    projects,
    deadlines,
    activity,
  };
}

export function deadlineHref(deadline: DashboardDeadline): string {
  if (deadline.projectId) {
    return projectHref(deadline.projectId, "tasks");
  }

  return "/tasks";
}

export function formatDashboardTaskLabel(deadline: DashboardDeadline): string {
  const parts: string[] = [];

  if (deadline.projectCode) {
    parts.push(formatProjectCodeDisplay(deadline.projectCode));
  }

  if (deadline.projectName) {
    parts.push(deadline.projectName);
  }

  parts.push(deadline.title);

  return parts.join(" - ");
}
