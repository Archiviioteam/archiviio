import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Settings,
  StickyNote,
  Truck,
  Users,
} from "lucide-react";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { t } from "@/lib/i18n/translations";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function getPrimaryNavItems(language: AppLanguage): NavItem[] {
  return [
    {
      href: "/dashboard",
      label: t(language, "navigation.dashboard"),
      icon: LayoutDashboard,
    },
    { href: "/projects", label: t(language, "navigation.projects"), icon: FolderKanban },
    { href: "/tasks", label: t(language, "navigation.tasks"), icon: CheckSquare },
    { href: "/contacts", label: t(language, "navigation.contacts"), icon: Users },
    { href: "/suppliers", label: t(language, "navigation.suppliers"), icon: Truck },
    { href: "/documents", label: t(language, "navigation.documents"), icon: FileText },
    { href: "/mail", label: t(language, "navigation.mail"), icon: Mail },
    { href: "/notes", label: t(language, "navigation.notes"), icon: StickyNote },
    {
      href: "/nomenclature",
      label: t(language, "navigation.nomenclature"),
      icon: BookOpen,
    },
  ];
}

export function getSettingsNavItem(language: AppLanguage): NavItem {
  return {
    href: "/settings",
    label: t(language, "navigation.settings"),
    icon: Settings,
  };
}

export const primaryNavItems: NavItem[] = getPrimaryNavItems("en");
export const settingsNavItem: NavItem = getSettingsNavItem("en");
export const sidebarNavItems: NavItem[] = [...primaryNavItems, settingsNavItem];

/** Nav items that stay active on nested child routes. */
const NESTED_NAV_HREFS = new Set<string>(["/projects", "/settings"]);

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const trimmed = withoutQuery.replace(/\/+$/, "");

  return trimmed || "/";
}

export function isNavItemActive(pathname: string, href: string): boolean {
  const normalizedPath = normalizePathname(pathname);
  const normalizedHref = normalizePathname(href);

  if (normalizedPath === normalizedHref) {
    return true;
  }

  if (!NESTED_NAV_HREFS.has(normalizedHref)) {
    return false;
  }

  return normalizedPath.startsWith(`${normalizedHref}/`);
}

export function getActiveNavHref(pathname: string): string | null {
  const normalizedPath = normalizePathname(pathname);
  const sidebarNavItems = [...getPrimaryNavItems("en"), getSettingsNavItem("en")];

  for (const item of sidebarNavItems) {
    if (isNavItemActive(normalizedPath, item.href)) {
      return item.href;
    }
  }

  return null;
}

export function getPageTitle(pathname: string, language: AppLanguage = "en"): string {
  const path = normalizePathname(pathname);

  if (path === "/dashboard") return t(language, "navigation.dashboard");
  if (path === "/projects") return t(language, "navigation.projects");
  if (path === "/projects/new") return t(language, "navigation.newProject");
  if (path.startsWith("/projects/")) return t(language, "navigation.project");
  if (path === "/contacts") return t(language, "navigation.contacts");
  if (path === "/suppliers") return t(language, "navigation.suppliers");
  if (path === "/documents") return t(language, "navigation.documents");
  if (path === "/mail") return t(language, "navigation.mail");
  if (path === "/tasks") return t(language, "navigation.tasks");
  if (path === "/notes") return t(language, "navigation.notes");
  if (path === "/nomenclature") return t(language, "navigation.nomenclature");
  if (path === "/settings") return t(language, "navigation.settings");
  if (path.startsWith("/settings/")) {
    const sectionId = path.split("/")[2] ?? "";
    if (sectionId === "profile") return t(language, "settings.profile.label");
    if (sectionId === "workspace") return t(language, "settings.workspace.label");
    if (sectionId === "team") return t(language, "settings.team.label");
    if (sectionId === "preferences") return t(language, "settings.preferences.label");
    return t(language, "navigation.settings");
  }
  return t(language, "navigation.appName");
}
