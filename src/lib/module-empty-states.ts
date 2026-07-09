import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckSquare,
  FileText,
  Settings,
  Truck,
  Users,
} from "lucide-react";

export const MODULE_PAGE_IDS = [
  "tasks",
  "contacts",
  "suppliers",
  "documents",
  "nomenclature",
  "settings",
] as const;

export type ModulePageId = (typeof MODULE_PAGE_IDS)[number];

export interface ModulePageEmptyState {
  icon: LucideIcon;
  message: string;
  actionLabel: string;
}

export const modulePageEmptyStates: Record<ModulePageId, ModulePageEmptyState> = {
  tasks: {
    icon: CheckSquare,
    message: "No tasks yet",
    actionLabel: "Add task",
  },
  contacts: {
    icon: Users,
    message: "No contacts yet",
    actionLabel: "Add contact",
  },
  suppliers: {
    icon: Truck,
    message: "No suppliers yet",
    actionLabel: "Add supplier",
  },
  documents: {
    icon: FileText,
    message: "No studio documents yet",
    actionLabel: "Upload studio document",
  },
  nomenclature: {
    icon: BookOpen,
    message: "No nomenclature yet",
    actionLabel: "Add rule",
  },
  settings: {
    icon: Settings,
    message: "No settings yet",
    actionLabel: "Add setting",
  },
};

export const modulePageDescriptions: Record<ModulePageId, string> = {
  tasks: "Track deadlines and assignments across projects.",
  contacts: "Manage clients and collaborators.",
  suppliers: "Manage vendors and external partners.",
  documents: "Browse and manage studio documents not tied to projects.",
  nomenclature: "Define naming conventions and file rules across projects.",
  settings: "Workspace and account preferences.",
};

export function getModulePageTitle(module: ModulePageId): string {
  return module.charAt(0).toUpperCase() + module.slice(1);
}
