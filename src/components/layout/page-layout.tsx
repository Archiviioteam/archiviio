import type { ReactNode } from "react";
import { stack } from "@/lib/spacing";
import { cn } from "@/lib/utils";

export { PageHeader } from "@/components/layout/page-header";
export type { PageHeaderProps } from "@/components/layout/page-header";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("flex flex-col", stack.relaxed, className)}>
      {children}
    </div>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex flex-col", stack.relaxed, className)}>
      {children}
    </div>
  );
}
