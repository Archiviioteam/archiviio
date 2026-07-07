import {
  dashboardGridClass,
  dashboardPanelClass,
  dashboardPanelContentClass,
  dashboardPanelHeaderClass,
  dashboardPanelInnerGapClass,
} from "@/lib/dashboard-layout";
import { ListItemSkeleton } from "@/components/loading/list-item-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

function DashboardSectionSkeleton({
  listItems = 3,
  quickActions = false,
  notesComposer = false,
}: {
  listItems?: number;
  quickActions?: boolean;
  notesComposer?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        dashboardPanelClass
      )}
    >
      <CardHeader className={dashboardPanelHeaderClass}>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className={dashboardPanelContentClass}>
        {quickActions ? (
          <div
            className={cn(
              "grid h-full min-h-0 flex-1 grid-cols-2 grid-rows-2",
              dashboardPanelInnerGapClass
            )}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className={cn("h-full min-h-0 w-full", radius.nested)}
              />
            ))}
          </div>
        ) : notesComposer ? (
          <div className="flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 pt-2 sm:pt-3">
            <Skeleton className={cn("h-9 w-full shrink-0", radius.control)} />
            <Skeleton className={cn("min-h-[10rem] flex-1 w-full sm:min-h-[12rem]", radius.control)} />
            <div className="flex justify-end">
              <Skeleton className={cn("h-8 w-20", radius.control)} />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              dashboardPanelInnerGapClass
            )}
          >
            {Array.from({ length: listItems }).map((_, index) => (
              <ListItemSkeleton key={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={dashboardGridClass}>
      <DashboardSectionSkeleton listItems={3} />
      <DashboardSectionSkeleton listItems={3} />
      <DashboardSectionSkeleton notesComposer />
      <DashboardSectionSkeleton quickActions />
    </div>
  );
}
