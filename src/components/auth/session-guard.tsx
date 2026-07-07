"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSessionRedirect } from "@/lib/auth/session-route";
import { createClient } from "@/lib/supabase/client";

interface SessionGuardProps {
  children: ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function enforceSessionRoute() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      const search = searchParams.toString();
      const redirectTo = getSessionRedirect(
        pathname,
        search ? `?${search}` : "",
        Boolean(user)
      );

      if (redirectTo) {
        router.replace(redirectTo);
        return;
      }

      setInitialCheckDone(true);
    }

    void enforceSessionRoute();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams]);

  if (!initialCheckDone) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
