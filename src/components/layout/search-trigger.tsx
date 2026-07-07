"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommandPaletteShortcutLabel } from "@/lib/layout/keyboard-shortcuts";
import { responsive } from "@/lib/layout/responsive";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        type="button"
        className={cn(
          radius.pill,
          "size-8 text-muted-foreground sm:hidden",
          className
        )}
        aria-label="Search"
      >
        <Search className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        type="button"
        className={cn(
          radius.pill,
          "hidden h-8 gap-2 px-4 text-muted-foreground sm:flex",
          className
        )}
        aria-label="Search"
      >
        <Search className="size-4" />
        <span className={textStyle.caption}>Search</span>
        <kbd
          className={cn(
            "pointer-events-none text-muted-foreground",
            textStyle.captionMedium,
            responsive.desktopOnly
          )}
        >
          {getCommandPaletteShortcutLabel()}
        </kbd>
      </Button>
    </>
  );
}
