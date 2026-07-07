"use client";

import { transition } from "@/lib/animation";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export const PROJECT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "documents", label: "Deliverables" },
  { id: "contacts", label: "Contacts" },
  { id: "suppliers", label: "Suppliers" },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]["id"];

interface ProjectTabsProps {
  activeTab: ProjectTabId;
  onTabChange: (tab: ProjectTabId) => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  const language = useAppLanguage();
  return (
    <div className="flex gap-1 overflow-x-auto">
      {PROJECT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 px-4 py-2",
            textStyle.body,
            transition.hover,
            activeTab === tab.id
              ? "font-bold text-foreground"
              : "text-muted-foreground"
          )}
        >
          {language === "it"
            ? tab.id === "overview"
              ? "Panoramica"
              : tab.id === "tasks"
                ? "Attività"
                : tab.id === "documents"
                  ? "Elaborati"
                  : tab.id === "contacts"
                    ? "Contatti"
                    : "Fornitori"
            : tab.label}
        </button>
      ))}
    </div>
  );
}
