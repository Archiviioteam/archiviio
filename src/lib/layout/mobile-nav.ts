import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  Settings,
  StickyNote,
  Truck,
  Users,
} from "lucide-react";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { t } from "@/lib/i18n/translations";

export type MobileTabId = "dashboard" | "projects" | "tasks" | "more";

export type MobileTabItem = {
  id: MobileTabId;
  href?: string;
  label: string;
  icon: LucideIcon;
};

export type MobileMoreItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function getMobileTabItems(language: AppLanguage): MobileTabItem[] {
  return [
    {
      id: "dashboard",
      href: "/dashboard",
      label: t(language, "navigation.dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "projects",
      href: "/projects",
      label: t(language, "navigation.projects"),
      icon: FolderKanban,
    },
    {
      id: "tasks",
      href: "/tasks",
      label: t(language, "navigation.tasks"),
      icon: CheckSquare,
    },
    {
      id: "more",
      label: t(language, "navigation.more"),
      icon: MoreHorizontal,
    },
  ];
}

export function getMobileMoreItems(language: AppLanguage): MobileMoreItem[] {
  return [
    {
      href: "/contacts",
      label: t(language, "navigation.contacts"),
      icon: Users,
    },
    {
      href: "/suppliers",
      label: t(language, "navigation.suppliers"),
      icon: Truck,
    },
    {
      href: "/documents",
      label: t(language, "navigation.documents"),
      icon: FileText,
    },
    {
      href: "/mail",
      label: t(language, "navigation.mail"),
      icon: Mail,
    },
    {
      href: "/notes",
      label: t(language, "navigation.notes"),
      icon: StickyNote,
    },
    {
      href: "/nomenclature",
      label: t(language, "navigation.nomenclature"),
      icon: BookOpen,
    },
    {
      href: "/settings",
      label: t(language, "navigation.settings"),
      icon: Settings,
    },
  ];
}

/** Map pathname to the active bottom-tab id. */
export function getActiveMobileTabId(pathname: string): MobileTabId {
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";

  if (path === "/dashboard" || path === "/") return "dashboard";
  if (path.startsWith("/projects")) return "projects";
  if (path.startsWith("/tasks")) return "tasks";

  return "more";
}
