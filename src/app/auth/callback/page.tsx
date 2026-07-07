"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { ensureUserWorkspace } from "@/lib/workspace";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const authError = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const next = getSafeRedirectPath(searchParams.get("next"));

      if (authError || errorCode) {
        const query =
          errorCode === "otp_expired"
            ? "email_link_expired"
            : "auth_callback_failed";
        router.replace(`/login?error=${query}`);
        return;
      }

      if (!code) {
        router.replace("/login?error=auth_callback_failed");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace("/login?error=auth_callback_failed");
        return;
      }

      const workspaceResult = await ensureUserWorkspace(supabase);
      if ("error" in workspaceResult) {
        router.replace("/login?error=workspace_setup_failed");
        return;
      }

      router.replace(next);
      router.refresh();
    }

    void handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[100dvh] flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">Completing sign-in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackHandler />
    </Suspense>
  );
}
