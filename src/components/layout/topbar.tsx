"use client";

import { usePathname } from "next/navigation";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { useLayout } from "@/components/layout/layout-provider";
import { getPageTitle } from "@/lib/layout/navigation";
import { responsive } from "@/lib/layout/responsive";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { pageTitleOverride } = useLayout();
  const pageTitle = pageTitleOverride ?? getPageTitle(pathname);

  return (
    <header
      className={cn(
        "relative flex h-16 shrink-0 items-center gap-3 bg-background pt-[env(safe-area-inset-top)]",
        responsive.contentShell,
        responsive.contentPaddingX
      )}
    >
      <h1
        className={cn(
          "min-w-0 text-foreground",
          textStyle.bodyMedium,
          textStyle.truncate
        )}
      >
        {pageTitle}
      </h1>

      <div className="flex-1" />

      <SearchTrigger />
    </header>
  );
}
