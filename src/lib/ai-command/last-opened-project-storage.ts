import type { Project } from "@/types/database";

export const LAST_OPENED_PROJECT_STORAGE_KEY = "archiviio:last-opened-project";
export const RECENTLY_OPENED_PROJECTS_STORAGE_LIMIT = 20;

export interface LastOpenedProjectSnapshot {
  id: string;
  name: string;
  code: string;
  openedAt: number;
}

type LastOpenedByWorkspace = Record<string, LastOpenedProjectSnapshot[]>;

function isSnapshot(value: unknown): value is LastOpenedProjectSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<LastOpenedProjectSnapshot>;
  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.name === "string" &&
    typeof snapshot.code === "string" &&
    typeof snapshot.openedAt === "number"
  );
}

function normalizeWorkspaceEntry(
  value: unknown
): LastOpenedProjectSnapshot[] {
  if (Array.isArray(value)) {
    return value
      .filter(isSnapshot)
      .sort((left, right) => right.openedAt - left.openedAt);
  }

  if (isSnapshot(value)) {
    return [value];
  }

  return [];
}

function readAll(): LastOpenedByWorkspace {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LAST_OPENED_PROJECT_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const map: LastOpenedByWorkspace = {};
    for (const [workspaceId, value] of Object.entries(parsed)) {
      map[workspaceId] = normalizeWorkspaceEntry(value);
    }

    return map;
  } catch {
    return {};
  }
}

function writeAll(map: LastOpenedByWorkspace): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LAST_OPENED_PROJECT_STORAGE_KEY,
    JSON.stringify(map)
  );
}

export function recordLastOpenedProject(
  workspaceId: string,
  project: Pick<Project, "id" | "name" | "code">
): void {
  const map = readAll();
  const current = map[workspaceId] ?? [];
  const nextSnapshot: LastOpenedProjectSnapshot = {
    id: project.id,
    name: project.name,
    code: project.code,
    openedAt: Date.now(),
  };

  map[workspaceId] = [
    nextSnapshot,
    ...current.filter((entry) => entry.id !== project.id),
  ].slice(0, RECENTLY_OPENED_PROJECTS_STORAGE_LIMIT);

  writeAll(map);
}

export function readLastOpenedProject(
  workspaceId: string
): LastOpenedProjectSnapshot | null {
  return readRecentlyOpenedProjects(workspaceId, 1)[0] ?? null;
}

export function readRecentlyOpenedProjects(
  workspaceId: string,
  limit = RECENTLY_OPENED_PROJECTS_STORAGE_LIMIT
): LastOpenedProjectSnapshot[] {
  return (readAll()[workspaceId] ?? []).slice(0, limit);
}
