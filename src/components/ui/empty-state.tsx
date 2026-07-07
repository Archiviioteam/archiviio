"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
  /** Expand and center within a flex parent (e.g. dashboard cards). */
  fill?: boolean;
  className?: string;
}

function EmptyStateIllustration({
  icon: Icon,
  compact,
}: {
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        radius.nested,
        "flex items-center justify-center bg-muted/30",
        compact ? "size-12" : "size-16"
      )}
    >
      <Icon
        className={cn("text-muted-foreground", compact ? "size-6" : "size-8")}
        strokeWidth={1.5}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  fill = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        fill && "min-h-0 flex-1",
        compact ? "gap-4" : "gap-6",
        !fill && (compact ? "py-4" : "py-8"),
        className
      )}
    >
      {icon ? <EmptyStateIllustration icon={icon} compact={compact} /> : null}

      {title || description ? (
        <div className="flex max-w-sm flex-col gap-2">
          {title ? (
            <p className={cn(textStyle.bodyMedium, "text-foreground")}>
              {title}
            </p>
          ) : null}
          {description ? (
            <p className={cn(textStyle.body, "text-muted-foreground")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {action ? (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>
              {action.icon ? <action.icon /> : null}
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button type="button" onClick={action.onClick}>
            {action.icon ? <action.icon /> : null}
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  );
}
