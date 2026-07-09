import type { AppLanguage } from "@/lib/settings/preferences-storage";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDateInput(value: string): Date {
  return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";

  const date = typeof value === "string" ? parseDateInput(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return `${formatDate(date)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatActivityDate(
  value: string,
  language: AppLanguage = "en"
): string {
  const date = parseDateInput(value);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) {
    return language === "it" ? "Oggi" : "Today";
  }

  return formatDate(date);
}
