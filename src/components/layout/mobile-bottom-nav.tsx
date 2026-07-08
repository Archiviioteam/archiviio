"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMoreSheet } from "@/components/layout/mobile-more-sheet";
import {
  getActiveMobileTabId,
  getMobileTabItems,
} from "@/lib/layout/mobile-nav";
import { responsive } from "@/lib/layout/responsive";
import { radius } from "@/lib/radius";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const language = useAppLanguage();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeTabId = getActiveMobileTabId(pathname);
  const tabs = getMobileTabItems(language);

  return (
    <>
      <nav
        aria-label={t(language, "navigation.bottomNavAria")}
        className={cn(
          responsive.phoneOnly,
          "fixed inset-x-0 bottom-0 z-50",
          "pointer-events-none px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
        )}
      >
        <div
          className={cn(
            "pointer-events-auto mx-auto flex h-14 max-w-md items-stretch justify-around px-2",
            "rounded-[20px] border border-white/60 bg-background/85 shadow-[0_8px_28px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === "more" ? activeTabId === "more" : activeTabId === tab.id;

            if (tab.id === "more") {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1",
                    radius.control,
                    "transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                  <span className={cn(textStyle.caption, "truncate")}>{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href!}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1",
                  radius.control,
                  "transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                <span className={cn(textStyle.caption, "truncate")}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
