import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import {
  buildProjectWritePayload,
  projectsHaveLocationColumn,
} from "@/lib/projects/schema";
import type { Project, ProjectStatus } from "@/types/database";

type UpdateProjectResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

export interface UpdateProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId: string;
  name?: string;
  status?: ProjectStatus;
  location?: string | null;
}

export async function updateProject({
  supabase,
  workspaceId,
  projectId,
  name,
  status,
  location,
}: UpdateProjectInput): Promise<UpdateProjectResult> {
  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Project not found." };
  }

  const project = existing as Project;
  const nextName = name?.trim() || project.name;
  const nextStatus = status ?? project.status;
  const nextLocation =
    location === undefined ? project.location : location?.trim() || null;

  if (!nextName) {
    return { ok: false, error: "Project name is required." };
  }

  const includeLocation = await projectsHaveLocationColumn(supabase);
  const payload = buildProjectWritePayload(
    {
      workspace_id: workspaceId,
      name: nextName,
      code: project.code,
      status: nextStatus,
      location: nextLocation,
    },
    { includeLocation }
  );

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update project",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "project.updated",
    entityType: "project",
    entityId: projectId,
    projectId,
    title: project.code,
    metadata: { project_name: nextName },
  });

  return { ok: true, project: data as Project };
}
