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
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        className
      )}
    >
      <CardHeader className={dashboardPanelHeaderClass}>
        <div className={cn("flex min-w-0 flex-1 flex-col", stack.compact)}>
          <CardTitle className={cn("text-body-lg sm:text-heading", textStyle.truncate)}>
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
        className={cn(dashboardPanelContentClass, contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}
