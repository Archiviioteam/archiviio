import type { MemberProfile } from "@/lib/users/member-display";

export const TASK_ASSIGNEE_COLUMNS =
  "id, first_name, last_name, full_name, email, avatar_url";

export const TASK_WITH_ASSIGNEE_SELECT = `*, assignee:users!assignee_user_id(${TASK_ASSIGNEE_COLUMNS})`;

export type TaskAssignee = MemberProfile;

type AssigneeRelation = TaskAssignee | TaskAssignee[] | null;

export function relatedTaskAssignee(value: AssigneeRelation): TaskAssignee | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
