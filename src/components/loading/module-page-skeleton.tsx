import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function ModulePageSkeleton() {
  return (
    <PageLayout>
      <PageContent>
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 py-8">
            <Skeleton className="size-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-44" />
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
