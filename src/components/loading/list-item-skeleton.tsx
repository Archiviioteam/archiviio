import { Skeleton } from "@/components/ui/skeleton";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

export function ListItemSkeleton() {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-muted/40 p-4",
        radius.nested
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}
