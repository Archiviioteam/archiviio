"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout/layout-provider";
import { getPageTitle } from "@/lib/layout/navigation";
import { responsive } from "@/lib/layout/responsive";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function Topbar() {
  const language = useAppLanguage();
  const pathname = usePathname();
  const { pageTitleOverride, setSidebarOpen } = useLayout();
  const pageTitle = pageTitleOverride ?? getPageTitle(pathname);

  return (
    <header
      className={cn(
        "relative flex h-14 w-full shrink-0 items-center justify-between pt-[env(safe-area-inset-top)] sm:h-16",
        "max-md:bg-background/90 max-md:backdrop-blur-xl",
        responsive.contentPaddingX
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(radius.control, responsive.tabletDrawerOnly, "size-9 shrink-0")}
          onClick={() => setSidebarOpen(true)}
          aria-label={t(language, "navigation.menu")}
        >
          <Menu className="size-5" />
        </Button>

        <h1
          className={cn(
            "min-w-0 flex-1 text-foreground",
            "max-md:text-[17px] max-md:font-semibold",
            textStyle.bodyMedium,
            textStyle.truncate
          )}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="shrink-0">
        <SearchTrigger />
      </div>
    </header>
  );
}
