import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { TaskUrgency } from "@/types/database";

export type TaskUrgencyLevel = "low" | "medium" | "high";

const taskUrgencyLabels: Record<AppLanguage, Record<TaskUrgencyLevel, string>> =
  {
    en: { low: "Low", medium: "Medium", high: "High" },
    it: { low: "Bassa", medium: "Media", high: "Alta" },
  };

export function getTaskUrgencyOptions(language: AppLanguage = "en") {
  return (["low", "medium", "high"] as const).map((value) => ({
    value,
    label: taskUrgencyLabels[language][value],
  }));
}

/** @deprecated Use `getTaskUrgencyOptions(language)` instead. */
export const taskUrgencyOptions = getTaskUrgencyOptions("en");

export function normalizeTaskUrgency(
  urgency: TaskUrgency | null | undefined
): TaskUrgencyLevel {
  if (urgency === "low" || urgency === "medium") {
    return urgency;
  }

  return "high";
}

export function getTaskUrgencyRank(
  urgency: TaskUrgency | null | undefined
): number {
  switch (urgency) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

export function getTaskUrgencyPillClass(urgency: TaskUrgencyLevel): string {
  const colors: Record<TaskUrgencyLevel, string> = {
    low: "bg-green-400",
    medium: "bg-yellow-400",
    high: "bg-red-400",
  };

  return colors[urgency];
}

export function getTaskUrgencyLabel(
  urgency: TaskUrgency | null,
  language: AppLanguage = "en"
): string {
  if (!urgency) {
    return "—";
  }

  const level = normalizeTaskUrgency(urgency);
  return taskUrgencyLabels[language][level] ?? taskUrgencyLabels[language].high;
}
