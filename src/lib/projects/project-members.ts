import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sortMembersByFirstName,
  type MemberProfile,
} from "@/lib/users/member-display";

const MEMBER_COLUMNS =
  "id, first_name, last_name, full_name, email, avatar_url";

type ProjectMemberRow = {
  user_id: string;
  users:
    | MemberProfile
    | MemberProfile[]
    | null;
};

function relatedUser(
  value: MemberProfile | MemberProfile[] | null
): MemberProfile | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchWorkspaceMembers(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<MemberProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select(MEMBER_COLUMNS)
    .eq("workspace_id", workspaceId);

  if (error) {
    return [];
  }

  return sortMembersByFirstName((data as MemberProfile[]) ?? []);
}

export async function fetchProjectMemberIds(
  supabase: SupabaseClient,
  projectId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  if (error) {
    return [];
  }

  return ((data as { user_id: string }[]) ?? []).map((row) => row.user_id);
}

export async function fetchProjectMembers(
  supabase: SupabaseClient,
  projectId: string
): Promise<MemberProfile[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select(`user_id, users(${MEMBER_COLUMNS})`)
    .eq("project_id", projectId);

  if (error) {
    return [];
  }

  const members = ((data as ProjectMemberRow[]) ?? [])
    .map((row) => relatedUser(row.users))
    .filter((member): member is MemberProfile => member !== null);

  return sortMembersByFirstName(members);
}

type ProjectMembersMapRow = {
  project_id: string;
  users: MemberProfile | MemberProfile[] | null;
};

export async function fetchProjectMembersMap(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<Map<string, MemberProfile[]>> {
  const map = new Map<string, MemberProfile[]>();

  if (projectIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase
    .from("project_members")
    .select(`project_id, users(${MEMBER_COLUMNS})`)
    .in("project_id", projectIds);

  if (error) {
    return map;
  }

  for (const row of (data as ProjectMembersMapRow[]) ?? []) {
    const member = relatedUser(row.users);
    if (!member) continue;

    const current = map.get(row.project_id) ?? [];
    current.push(member);
    map.set(row.project_id, current);
  }

  for (const [projectId, members] of map) {
    map.set(projectId, sortMembersByFirstName(members));
  }

  return map;
}

export async function setProjectMembers(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
  userIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const uniqueUserIds = [...new Set(userIds)];

  if (uniqueUserIds.length === 0) {
    return { ok: false, error: "At least one project referent is required." };
  }

  const { data: existing, error: readError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const existingIds = new Set(
    ((existing as { user_id: string }[]) ?? []).map((row) => row.user_id)
  );
  const nextIds = new Set(uniqueUserIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = uniqueUserIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .in("user_id", toRemove);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("project_members").insert(
      toAdd.map((userId) => ({
        workspace_id: workspaceId,
        project_id: projectId,
        user_id: userId,
      }))
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

export function resolveDefaultAssigneeId(
  members: MemberProfile[],
  currentUserId: string | null
): string | null {
  if (members.length === 0) {
    return null;
  }

  if (currentUserId && members.some((member) => member.id === currentUserId)) {
    return currentUserId;
  }

  return members[0]?.id ?? null;
}
