"use client";

import type { MouseEvent, PointerEvent } from "react";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useLayout } from "@/components/layout/layout-provider";
import { getCommandPaletteShortcutLabel } from "@/lib/layout/keyboard-shortcuts";
import { responsive } from "@/lib/layout/responsive";
import { radius } from "@/lib/radius";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

type SearchTriggerVariant = "topbar" | "dashboard";

interface SearchTriggerProps {
  variant?: SearchTriggerVariant;
  className?: string;
}

export function SearchTrigger({
  variant = "topbar",
  className,
}: SearchTriggerProps) {
  const language = useAppLanguage();
  const { openCommandPalette } = useLayout();

  function handleOpen(event: MouseEvent | PointerEvent) {
    event.stopPropagation();
    openCommandPalette();
  }

  if (variant === "dashboard") {
    return (
      <button
        type="button"
        data-tauri-drag-region-exclude
        data-no-drag
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleOpen}
        className={cn(
          radius.pill,
          "flex h-12 w-full max-w-md items-center gap-2 border border-input bg-card px-4 text-left transition-colors hover:bg-accent/40",
          className
        )}
        aria-label={t(language, "search.open")}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-muted-foreground",
            textStyle.body
          )}
        >
          {t(language, "search.triggerLong")}
        </span>
        <kbd
          className={cn(
            "hidden shrink-0 text-muted-foreground sm:inline",
            textStyle.captionMedium
          )}
        >
          {getCommandPaletteShortcutLabel()}
        </kbd>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        data-tauri-drag-region-exclude
        data-no-drag
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          radius.pill,
          "size-8 text-muted-foreground sm:hidden",
          className
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleOpen}
        aria-label={t(language, "search.open")}
      >
        <Search className="size-4" />
      </button>

      <button
        type="button"
        data-tauri-drag-region-exclude
        data-no-drag
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          radius.pill,
          "hidden h-8 gap-2 px-4 text-muted-foreground sm:inline-flex",
          className
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleOpen}
        aria-label={t(language, "search.open")}
      >
        <Search className="size-4" />
        <span className={textStyle.caption}>{t(language, "search.trigger")}</span>
        <kbd
          className={cn(
            "pointer-events-none text-muted-foreground",
            textStyle.captionMedium,
            responsive.desktopOnly
          )}
        >
          {getCommandPaletteShortcutLabel()}
        </kbd>
      </button>
    </>
  );
}
