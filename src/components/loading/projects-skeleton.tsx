import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { ProjectCardSkeleton } from "@/components/loading/project-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsSkeleton() {
  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 min-w-0 flex-1 rounded-full" />
            <Skeleton className="h-9 w-28 shrink-0" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
