import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardPanelContentClass,
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
}

export function DashboardSection({
  title,
  action,
  children,
  className,
  contentClassName,
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
      <CardHeader className={dashboardPanelHeaderClass}>
        <div className={cn("flex min-w-0 flex-1 flex-col", stack.compact)}>
          <CardTitle className={cn("text-body-lg sm:text-heading")}>
            {title}
          </CardTitle>
        </div>
        {action?.href ? (
          <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : action?.onClick ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            type="button"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent
        className={cn(dashboardPanelContentClass, contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}
