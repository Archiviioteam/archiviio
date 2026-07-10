import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardPanelContentClass,
  dashboardPanelCompactContentClass,
  dashboardPanelCompactHeaderClass,
  dashboardPanelHeaderClass,
} from "@/lib/dashboard-layout";
import { stack } from "@/lib/spacing";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}

export function DashboardSection({
  title,
  action,
  children,
  className,
  contentClassName,
  compact = false,
}: DashboardSectionProps) {
  return (
    <Card
      data-dashboard-panel
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden",
        "h-auto max-lg:h-auto lg:h-full",
        className
      )}
    >
      <CardHeader
        className={compact ? dashboardPanelCompactHeaderClass : dashboardPanelHeaderClass}
      >
        <div className={cn("flex min-w-0 flex-1 flex-col", stack.compact)}>
          <CardTitle
            className={cn(
              compact ? "text-body font-medium" : "text-body-lg sm:text-heading",
              textStyle.truncate
            )}
          >
            {title}
          </CardTitle>
        </div>
        {action?.href ? (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : action?.onClick ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            type="button"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent
        className={cn(
          compact ? dashboardPanelCompactContentClass : dashboardPanelContentClass,
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
