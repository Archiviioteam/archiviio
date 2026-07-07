import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectStatus } from "@/types/database";

const PROJECT_BASE_COLUMNS =
  "id, name, code, workspace_id, status, created_at" as const;

const PROJECT_WITH_LOCATION_COLUMNS =
  "id, name, code, location, workspace_id, status, created_at" as const;

let locationColumnAvailable: boolean | null = null;

export async function projectsHaveLocationColumn(
  supabase: SupabaseClient
): Promise<boolean> {
  if (locationColumnAvailable !== null) {
    return locationColumnAvailable;
  }

  const { error } = await supabase.from("projects").select("location").limit(0);
  locationColumnAvailable = !error;
  return locationColumnAvailable;
}

export async function projectListSelectColumns(
  supabase: SupabaseClient
): Promise<string> {
  return (await projectsHaveLocationColumn(supabase))
    ? PROJECT_WITH_LOCATION_COLUMNS
    : PROJECT_BASE_COLUMNS;
}

export interface ProjectWriteInput {
  workspace_id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  location?: string | null;
}

export function buildProjectWritePayload(
  input: ProjectWriteInput,
  options: { includeLocation: boolean }
): ProjectWriteInput {
  const payload: ProjectWriteInput = {
    workspace_id: input.workspace_id,
    name: input.name,
    code: input.code,
    status: input.status,
  };

  if (options.includeLocation) {
    payload.location = input.location ?? null;
  }

  return payload;
}
