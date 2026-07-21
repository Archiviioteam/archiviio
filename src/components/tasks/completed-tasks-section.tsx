"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { transition } from "@/lib/animation";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface CompletedTasksSectionProps {
  count: number;
  children: ReactNode;
}

export function CompletedTasksSection({
  count,
  children,
}: CompletedTasksSectionProps) {
  const language = useAppLanguage();
  const [open, setOpen] = useState(false);

  if (count === 0) {
    return null;
  }

  return (
    <Card>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 p-4 text-left",
          transition.hover
        )}
      >
        <span className={cn(textStyle.bodyMedium, "text-foreground")}>
          {t(language, "tasks.completedTasks")} ({count})
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            transition.hover,
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <CardContent className="flex flex-col gap-3 pt-0">{children}</CardContent>
      ) : null}
    </Card>
  );
}
