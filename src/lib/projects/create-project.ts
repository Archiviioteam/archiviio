import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/activity";
import { generateProjectCode } from "@/lib/projects";
import {
  buildProjectWritePayload,
  projectsHaveLocationColumn,
} from "@/lib/projects/schema";
import type { Project, ProjectStatus } from "@/types/database";

type CreateProjectResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

export interface CreateProjectInput {
  supabase: SupabaseClient;
  workspaceId: string;
  name: string;
  status?: ProjectStatus;
  location?: string | null;
}

export async function createProject({
  supabase,
  workspaceId,
  name,
  status = "active",
  location = null,
}: CreateProjectInput): Promise<CreateProjectResult> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { ok: false, error: "Project name is required." };
  }

  const code = await generateProjectCode(supabase, workspaceId);
  const includeLocation = await projectsHaveLocationColumn(supabase);
  const payload = buildProjectWritePayload(
    {
      workspace_id: workspaceId,
      name: trimmedName,
      code,
      status,
      location: location?.trim() || null,
    },
    { includeLocation }
  );

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create project",
    };
  }

  void logActivity(supabase, {
    workspaceId,
    action: "project.created",
    entityType: "project",
    entityId: data.id,
    projectId: data.id,
    title: code,
    metadata: { project_name: trimmedName },
  });

  return { ok: true, project: data as Project };
}
