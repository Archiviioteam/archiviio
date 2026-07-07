"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureUserWorkspace } from "@/lib/workspace";
import { ContentArea } from "@/components/layout/content-area";
import { LayoutProvider } from "@/components/layout/layout-provider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useIsMobile } from "@/lib/layout/use-is-mobile";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import {
  appShellRootClass,
  desktopColumnWrapperClass,
  radiusTierProps,
} from "@/lib/radius";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellFrame({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const isDashboardOrSettings =
    pathname === "/dashboard" || pathname === "/settings";
  const isFullHeightGrid = !isMobile && isDashboardOrSettings;
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient();
      const result = await ensureUserWorkspace(supabase);

      if ("error" in result) {
        router.replace("/login?error=workspace_setup_failed");
        return;
      }

      setWorkspaceName(result.workspace.name);
      setLoading(false);
    }

    void loadWorkspace();
  }, [router]);

  return (
    <div className={appShellRootClass(false)} {...radiusTierProps("shell")}>
      <Sidebar workspaceName={workspaceName ?? "Workspace"} />
      <div className={desktopColumnWrapperClass(false, true)}>
        <Topbar />
        <ContentArea scrollable={!isFullHeightGrid}>
          {loading ? (
            <p className={cn(textStyle.body, "text-muted-foreground")}>
              Loading...
            </p>
          ) : (
            children
          )}
        </ContentArea>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <LayoutProvider>
      <AppShellFrame>{children}</AppShellFrame>
    </LayoutProvider>
  );
}
