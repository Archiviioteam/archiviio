import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProjectCodeDisplay } from "@/lib/projects";
import {
  contactHref,
  documentHref,
  nomenclatureHref,
  projectHref,
  supplierHref,
} from "@/lib/search/search-routes";
import type { ActivityAction, ActivityEntityType } from "@/types/database";

export const ACTIVITY_FEED_DEFAULT_LIMIT = 8;
export const PROJECT_ACTIVITY_LIMIT = 20;

export function formatActivityDate(
  value: string,
  language: AppLanguage = "en"
): string {
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) {
    return language === "it" ? "Oggi" : "Today";
  }

  const locale = language === "it" ? "it-IT" : "en-US";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export interface LogActivityInput {
  workspaceId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  projectId?: string | null;
  title: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityEntityType;
  message: string;
  subtitle: string | null;
  href: string;
  timestamp: string;
  actorName: string;
}

type ActivityEventRow = {
  id: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  project_id: string | null;
  title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  users: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

export function getActorDisplayName(user: {
  full_name: string | null;
  email: string;
}): string {
  const fullName = user.full_name?.trim();
  if (fullName) {
    return fullName.split(/\s+/)[0];
  }

  return user.email.split("@")[0];
}

function formatActivityTitle(action: ActivityAction, title: string): string {
  switch (action) {
    case "project.created":
    case "project.updated":
    case "project.deleted":
    case "nomenclature.updated":
      return formatProjectCodeDisplay(title);
    default:
      return title;
  }
}

function formatActivityDescription(
  action: ActivityAction,
  title: string,
  metadata?: Record<string, unknown>
): string {
  const displayTitle = formatActivityTitle(action, title);

  switch (action) {
    case "project.created":
      return `created project ${displayTitle}`;
    case "project.updated":
      return `updated project ${displayTitle}`;
    case "project.deleted":
      return `deleted project ${displayTitle}`;
    case "document.uploaded":
      return `uploaded "${displayTitle}"`;
    case "document.deleted":
      return `deleted "${displayTitle}"`;
    case "document.tags_updated":
      return `updated tags on "${displayTitle}"`;
    case "nomenclature.updated":
      return `updated nomenclature for ${displayTitle}`;
    case "contact.created":
      return `added contact ${displayTitle}`;
    case "contact.updated":
      return `updated contact ${displayTitle}`;
    case "contact.deleted":
      return `removed contact ${displayTitle}`;
    case "contact.linked":
      return `linked contact ${displayTitle}`;
    case "contact.unlinked":
      return `removed contact ${displayTitle} from project`;
    case "supplier.created":
      return `added supplier ${displayTitle}`;
    case "supplier.updated":
      return `updated supplier ${displayTitle}`;
    case "supplier.deleted":
      return `removed supplier ${displayTitle}`;
    case "supplier.linked":
      return `linked supplier ${displayTitle}`;
    case "supplier.unlinked":
      return `removed supplier ${displayTitle} from project`;
    case "task.created":
      return `added task "${displayTitle}"`;
    case "task.updated":
      return `updated task "${displayTitle}"`;
    case "task.status_changed": {
      const status = metadata?.status;
      return status
        ? `marked task "${displayTitle}" as ${status}`
        : `updated task "${displayTitle}"`;
    }
    case "task.deleted":
      return `removed task "${displayTitle}"`;
    case "workspace.created":
      return `created workspace ${displayTitle}`;
    default:
      return `updated ${displayTitle}`;
  }
}

export function formatActivityMessage(
  action: ActivityAction,
  actorName: string,
  title: string,
  metadata?: Record<string, unknown>
): string {
  const activity = formatActivityDescription(action, title, metadata);
  return `${actorName} - ${activity}`;
}

function relatedUser(
  value: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null
): { full_name: string | null; email: string } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function activityHref(event: ActivityEventRow): string {
  const entityId = event.entity_id;

  if (event.action === "project.deleted") {
    return "/projects";
  }

  switch (event.entity_type) {
    case "project":
      return entityId ? projectHref(entityId) : "/projects";
    case "document":
      return entityId
        ? documentHref(entityId, event.project_id)
        : "/documents";
    case "nomenclature":
      return event.project_id
        ? nomenclatureHref(event.project_id)
        : "/projects";
    case "contact":
      return entityId ? contactHref(entityId) : "/contacts";
    case "supplier":
      return entityId ? supplierHref(entityId) : "/suppliers";
    case "task":
      return event.project_id
        ? projectHref(event.project_id, "tasks")
        : "/tasks";
    case "workspace":
      return "/settings";
    default:
      return "/dashboard";
  }
}

function activitySubtitle(
  event: ActivityEventRow
): string | null {
  const metadata = event.metadata ?? {};
  const projectName = metadata.project_name;
  const projectCode = metadata.project_code;

  if (typeof projectName === "string" && projectName.trim()) {
    return projectName.trim();
  }

  if (typeof projectCode === "string" && projectCode.trim()) {
    return formatProjectCodeDisplay(projectCode.trim());
  }

  return null;
}

export async function logActivity(
  supabase: SupabaseClient,
  input: LogActivityInput
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    console.error("Failed to log activity: no authenticated user");
    return false;
  }

  const { error } = await supabase.from("activity_events").insert({
    workspace_id: input.workspaceId,
    actor_id: user.id,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    project_id: input.projectId ?? null,
    title: input.title,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
    return false;
  }

  return true;
}

export async function fetchActivityFeed(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: { limit?: number; projectId?: string }
): Promise<ActivityFeedItem[]> {
  const limit = options?.limit ?? ACTIVITY_FEED_DEFAULT_LIMIT;

  let query = supabase
    .from("activity_events")
    .select(
      "id, action, entity_type, entity_id, project_id, title, metadata, created_at, users(full_name, email)"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.projectId) {
    query = query.eq("project_id", options.projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch activity feed:", error.message);
    return [];
  }

  return ((data as ActivityEventRow[]) ?? []).map((row) => {
    const actor = relatedUser(row.users);
    const actorName = actor
      ? getActorDisplayName(actor)
      : "Someone";

    return {
      id: row.id,
      type: row.entity_type,
      message: formatActivityMessage(
        row.action,
        actorName,
        row.title,
        row.metadata ?? undefined
      ),
      subtitle: activitySubtitle(row),
      href: activityHref(row),
      timestamp: row.created_at,
      actorName,
    };
  });
}
