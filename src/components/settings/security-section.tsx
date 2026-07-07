"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, MonitorSmartphone, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { clearCachedWorkspaceId } from "@/lib/workspace";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";

type PasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

export function SecuritySettingsCards() {
  const language = useAppLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      setEmail(user?.email ?? "");
      setLastSignIn(user?.last_sign_in_at ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validatePassword = useCallback((): boolean => {
    const nextErrors: PasswordErrors = {};

    if (passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = t(language, "settings.security.passwordMinLength");
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = t(
        language,
        "settings.security.passwordMismatch"
      );
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [language, passwordForm]);

  const handleChangePassword = useCallback(async () => {
    if (!validatePassword()) return;

    setChangingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (error) {
      toast.error(error.message);
      setChangingPassword(false);
      return;
    }

    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setChangingPassword(false);
    toast.success(t(language, "settings.security.passwordUpdated"));
  }, [language, passwordForm, validatePassword]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    clearCachedWorkspaceId();
    router.replace("/login");
  }, [router]);

  const handleSignOutAll = useCallback(async () => {
    setSigningOutAll(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      toast.error(error.message);
      setSigningOutAll(false);
      return;
    }

    clearCachedWorkspaceId();
    router.replace("/login");
  }, [router]);

  const locale = language === "it" ? "it-IT" : "en-US";
  const formattedLastSignIn = lastSignIn
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSignIn))
    : t(language, "settings.security.lastSignInUnknown");

  return (
    <>
      <SettingsSectionCard
        title={t(language, "settings.security.changePassword")}
        description={t(language, "settings.security.changePasswordDescription")}
        footer={
          <Button
            type="button"
            onClick={() => void handleChangePassword()}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="animate-spin" />
                {t(language, "settings.security.updating")}
              </>
            ) : (
              t(language, "settings.security.updatePassword")
            )}
          </Button>
        }
      >
        <SettingsField
          label={t(language, "settings.security.newPassword")}
          htmlFor="new-password"
          error={passwordErrors.newPassword}
        >
          <Input
            id="new-password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                newPassword: event.target.value,
              }))
            }
            autoComplete="new-password"
          />
        </SettingsField>

        <SettingsField
          label={t(language, "settings.security.confirmPassword")}
          htmlFor="confirm-password"
          error={passwordErrors.confirmPassword}
        >
          <Input
            id="confirm-password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
            autoComplete="new-password"
          />
        </SettingsField>
      </SettingsSectionCard>

      <SettingsSectionCard
        title={t(language, "settings.security.activeSessions")}
        description={t(language, "settings.security.activeSessionsDescription")}
      >
        {loading ? (
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "settings.security.loadingSession")}
          </p>
        ) : (
          <div
            className={cn(
              "flex items-start gap-4 border border-border/60 bg-muted/20 p-4",
              radius.nested,
              transition.hover
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center bg-card",
                radius.control
              )}
            >
              <MonitorSmartphone className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={textStyle.bodyMedium}>
                  {t(language, "settings.security.thisDevice")}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5",
                    radius.pill,
                    textStyle.caption,
                    "bg-primary/10 text-primary"
                  )}
                >
                  <Shield className="size-3" />
                  {t(language, "settings.security.currentSession")}
                </span>
              </div>
              <p className={cn(textStyle.caption, "text-muted-foreground")}>
                {email}
              </p>
              <p className={cn(textStyle.caption, "text-muted-foreground")}>
                {t(language, "settings.security.lastSignIn")}: {formattedLastSignIn}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSignOut()}
            disabled={signingOut || signingOutAll}
          >
            {signingOut ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogOut />
            )}
            {t(language, "settings.security.logoutCurrent")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleSignOutAll()}
            disabled={signingOut || signingOutAll}
          >
            {signingOutAll ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogOut />
            )}
            {t(language, "settings.security.logoutAll")}
          </Button>
        </div>
      </SettingsSectionCard>
    </>
  );
}
