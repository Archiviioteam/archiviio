"use client";

import type { ReactNode } from "react";
import { responsive } from "@/lib/layout/responsive";
import { cn } from "@/lib/utils";

interface ContentAreaProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function ContentArea({
  children,
  className,
  scrollable = true,
}: ContentAreaProps) {
  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background",
        scrollable ? "overflow-y-auto" : "overflow-hidden"
      )}
    >
      <div
        className={cn(
          responsive.contentShell,
          scrollable ? "flex-1" : "flex h-full min-h-0 flex-col overflow-hidden",
          responsive.contentPaddingX,
          "pt-4 sm:pt-6 lg:pt-8",
          responsive.contentSafeAreaBottom,
          className
        )}
      >
        {children}
      </div>
    </main>
  );
}
