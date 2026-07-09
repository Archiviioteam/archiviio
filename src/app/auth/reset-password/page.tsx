"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const language = useAppLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?error=auth_callback_failed");
        return;
      }

      setReady(true);
    })();
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error(t(language, "settings.security.passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t(language, "settings.security.passwordMismatch"));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t(language, "settings.security.passwordUpdated"));
    router.replace("/dashboard");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] flex-1 items-center justify-center">
        <p className={cn(textStyle.body, "text-muted-foreground")}>
          {t(language, "common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-1 items-center justify-center p-6">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex w-full max-w-md flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h1 className={textStyle.pageTitle}>
            {t(language, "settings.security.changePassword")}
          </h1>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "settings.security.resetPasswordPageDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-password" className={textStyle.captionMedium}>
            {t(language, "settings.security.newPassword")}
          </label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm-password" className={textStyle.captionMedium}>
            {t(language, "settings.security.confirmPassword")}
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" />
              {t(language, "settings.security.updating")}
            </>
          ) : (
            t(language, "settings.security.updatePassword")
          )}
        </Button>
      </form>
    </div>
  );
}
