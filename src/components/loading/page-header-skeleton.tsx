import { responsive } from "@/lib/layout/responsive";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageHeaderSkeletonProps {
  /** Mirrors PageHeader `actions` slot in the top-right corner. */
  actions?: boolean;
  /** Mirrors PageHeader `description` below the title. */
  description?: boolean;
  className?: string;
}

export function PageHeaderSkeleton({
  actions = false,
  description = true,
  className,
}: PageHeaderSkeletonProps) {
  if (!actions && !description) {
    return null;
  }

  return (
    <header
      className={cn(
        responsive.pageHeader,
        actions && !description && "justify-end",
        className
      )}
    >
      {description ? (
        <div className="flex min-w-0 flex-col gap-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      ) : null}
      {actions ? <Skeleton className="h-9 w-28 shrink-0" /> : null}
    </header>
  );
}
