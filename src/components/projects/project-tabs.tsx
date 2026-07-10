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

const DEPRECATED_PROJECT_TAB_IDS = new Set(["mail"]);

export function isDeprecatedProjectTab(value: string | null): boolean {
  return value !== null && DEPRECATED_PROJECT_TAB_IDS.has(value);
}

export function parseProjectTab(value: string | null): ProjectTabId {
  const validTabs = new Set(PROJECT_TABS.map((tab) => tab.id));
  if (value && validTabs.has(value as ProjectTabId)) {
    return value as ProjectTabId;
  }

  return "overview";
}

interface ProjectTabsProps {
  activeTab: ProjectTabId;
  onTabChange: (tab: ProjectTabId) => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  const language = useAppLanguage();
  const tabLabelById: Record<ProjectTabId, string> = {
    overview: language === "it" ? "Panoramica" : "Overview",
    tasks: language === "it" ? "Attività" : "Tasks",
    documents: language === "it" ? "Elaborati" : "Deliverables",
    contacts: language === "it" ? "Contatti" : "Contacts",
    suppliers: language === "it" ? "Fornitori" : "Suppliers",
  };

  return (
    <div className="space-y-2 pb-1">
      <div className="sm:hidden">
        <label
          htmlFor="project-tab-select"
          className={cn(textStyle.caption, "mb-1 block text-muted-foreground")}
        >
          {language === "it" ? "Sezione" : "Section"}
        </label>
        <select
          id="project-tab-select"
          value={activeTab}
          onChange={(event) => onTabChange(event.target.value as ProjectTabId)}
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none",
            textStyle.bodyMedium,
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          {PROJECT_TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tabLabelById[tab.id]}
            </option>
          ))}
        </select>
      </div>

      <div className="-mx-1 hidden gap-1 overflow-x-auto px-1 sm:flex">
        {PROJECT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-2 sm:px-4",
              textStyle.body,
              transition.hover,
              activeTab === tab.id
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {tabLabelById[tab.id]}
          </button>
        ))}
      </div>
    </div>
  );
}
