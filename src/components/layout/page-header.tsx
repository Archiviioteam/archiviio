import type { ReactNode } from "react";
import { responsive } from "@/lib/layout/responsive";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Optional content shown above the title (e.g. project code). */
  leading?: ReactNode;
  /** Optional action area rendered in the top-right corner. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  leading,
  actions,
  className,
}: PageHeaderProps) {
  if (!title && !description && !leading && !actions) {
    return null;
  }

  const actionsOnly = !leading && !title && !description && actions;

  return (
    <header
      className={cn(
        responsive.pageHeader,
        actionsOnly && "justify-end",
        className
      )}
    >
      {leading || title || description ? (
        <div className="flex min-w-0 flex-col gap-1">
          {leading}
          {title ? (
            <h1 className={cn(textStyle.pageTitle, "text-foreground")}>
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className={cn(textStyle.body, "text-muted-foreground")}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
