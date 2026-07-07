"use client";

import { Suspense, type ReactNode } from "react";
import { SessionGuard } from "@/components/auth/session-guard";

export function SessionGuardRoot({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SessionGuard>{children}</SessionGuard>
    </Suspense>
  );
}
