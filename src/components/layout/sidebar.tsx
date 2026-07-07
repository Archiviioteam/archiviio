"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { t } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { clearCachedWorkspaceId } from "@/lib/workspace";
import {
  getActiveNavHref,
  getPrimaryNavItems,
  getSettingsNavItem,
} from "@/lib/layout/navigation";
import { isOverlaySidebarViewport } from "@/lib/layout/responsive";
import { useAppLanguage } from "@/lib/settings/language";
import { motion } from "@/lib/animation";
import {
  desktopSidebarInsetClass,
  desktopSidebarPanelClass,
} from "@/lib/radius";
import { elevation, overlay, radiusTierProps, sidebarNavItemClass } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useLayout } from "@/components/layout/layout-provider";

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={sidebarNavItemClass(isActive)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({ workspaceName: _workspaceName }: { workspaceName: string }) {
  const language = useAppLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const activeHref = getActiveNavHref(pathname);
  const primaryNavItems = getPrimaryNavItems(language);
  const settingsNavItem = getSettingsNavItem(language);
  const SettingsIcon = settingsNavItem.icon;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCachedWorkspaceId();
    router.push("/login");
    router.refresh();
  }

  function handleNavClick() {
    if (isOverlaySidebarViewport()) {
      setSidebarOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={t(language, "common.close")}
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          overlay,
          motion.sidebarOverlay,
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={cn(
          "h-full shrink-0 overflow-hidden max-lg:w-0",
          motion.sidebar,
          "lg:w-sidebar"
        )}
      >
        <div className={cn("flex h-full flex-col", desktopSidebarInsetClass(false))}>
          <aside
            aria-label={t(language, "navigation.sidebarAria")}
            aria-hidden={!sidebarOpen}
            {...radiusTierProps("surface")}
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
              desktopSidebarPanelClass(false),
              elevation.sm,
              "max-lg:fixed max-lg:bottom-[max(12px,env(safe-area-inset-bottom))] max-lg:left-3 max-lg:top-[max(12px,env(safe-area-inset-top))] max-lg:z-50 max-lg:w-sidebar",
              "lg:static lg:h-full lg:w-full",
              motion.sidebar,
              sidebarOpen
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto"
            )}
          >
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={activeHref === item.href}
                  onNavigate={handleNavClick}
                />
              ))}
            </nav>

            <div className="flex shrink-0 flex-col gap-1 p-3">
              <NavLink
                href={settingsNavItem.href}
                label={settingsNavItem.label}
                icon={SettingsIcon}
                isActive={activeHref === settingsNavItem.href}
                onNavigate={handleNavClick}
              />
              <button
                type="button"
                onClick={handleSignOut}
                className={sidebarNavItemClass(false)}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(language, "common.signOut")}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
