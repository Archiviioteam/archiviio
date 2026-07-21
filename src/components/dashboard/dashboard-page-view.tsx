"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useIsMobile } from "@/lib/layout/use-is-mobile";

export function DashboardPageView() {
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (isMobile) {
      router.replace("/projects");
    }
  }, [isMobile, router]);

  if (isMobile) {
    return null;
  }

  return <DashboardContent />;
}
