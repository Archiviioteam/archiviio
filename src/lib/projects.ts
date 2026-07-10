import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { ProjectStatus } from "@/types/database";

const projectStatusLabels: Record<
  AppLanguage,
  Record<ProjectStatus, string>
> = {
  en: {
    active: "Active",
    on_hold: "On hold",
    completed: "Completed",
    archived: "Archived",
  },
  it: {
    active: "Attivo",
    on_hold: "In pausa",
    completed: "Completato",
    archived: "Archiviato",
  },
};

/** @deprecated Use `formatProjectStatus(status, language)` instead. */
export const projectStatusLabels_en = projectStatusLabels.en;

export function formatProjectStatus(
  status: ProjectStatus,
  language: AppLanguage = "en"
): string {
  return projectStatusLabels[language][status];
}

export function formatProjectCodeDisplay(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;

  const rifMatch = trimmed.match(/^rif#(.+)$/i);
  if (rifMatch) return `#${rifMatch[1]}`;

  return `#${trimmed}`;
}

export function getProjectStatusPillClass(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    active: "bg-green-400",
    on_hold: "bg-red-400",
    completed: "bg-yellow-400",
    archived: "bg-muted",
  };

  return colors[status];
}

const projectStatusOrder: ProjectStatus[] = [
  "active",
  "on_hold",
  "completed",
  "archived",
];

export function getProjectStatusOptions(language: AppLanguage = "en") {
  return projectStatusOrder.map((value) => ({
    value,
    label: formatProjectStatus(value, language),
    pillClass: getProjectStatusPillClass(value),
  }));
}

const CODE_PREFIX = "rif#";
const CODE_PATTERN = /^rif#(\d{4})$/;

export function formatProjectCode(value: number): string {
  return `${CODE_PREFIX}${String(value).padStart(4, "0")}`;
}

export function parseProjectCodeNumber(code: string): number {
  const digits = code
    .trim()
    .toLowerCase()
    .replace(/^rif#/, "")
    .replace(/^#/, "")
    .replace(/\D/g, "");

  if (!digits) return Number.NEGATIVE_INFINITY;

  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function compareProjectsByCodeDescending(
  a: { code: string },
  b: { code: string }
): number {
  return parseProjectCodeNumber(b.code) - parseProjectCodeNumber(a.code);
}

export function sortProjectsByCodeDescending<T extends { code: string }>(
  projects: T[]
): T[] {
  return [...projects].sort(compareProjectsByCodeDescending);
}

export function yearProjectCode(date = new Date()): string {
  return `${CODE_PREFIX}${date.getFullYear()}`;
}

async function fetchProjectCodes(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("projects")
    .select("code")
    .eq("workspace_id", workspaceId);

  return (data ?? []).map((row) => row.code);
}

export function nextSequentialCode(existingCodes: string[]): string {
  const numbers = existingCodes
    .map((code) => {
      const match = code.match(CODE_PATTERN);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((n) => !Number.isNaN(n));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return formatProjectCode(next);
}

export async function generateProjectCode(
  supabase: SupabaseClient,
  workspaceId: string,
  options: { useYear?: boolean } = {}
): Promise<string> {
  const existingCodes = await fetchProjectCodes(supabase, workspaceId);

  if (options.useYear) {
    const yearCode = yearProjectCode();
    if (!existingCodes.includes(yearCode)) {
      return yearCode;
    }
  }

  return nextSequentialCode(existingCodes);
}
