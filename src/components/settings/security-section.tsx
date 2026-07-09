"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, MonitorSmartphone, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { clearCachedWorkspaceId } from "@/lib/workspace";
import { deleteAccount } from "@/lib/settings/delete-account";
import { getAuthCallbackUrl } from "@/lib/supabase/site-url";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date-format";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import type { MemberRole } from "@/types/database";

export function SecuritySettingsCards() {
  const language = useAppLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("owner");
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setEmail(user.email ?? "");
      setRole((profile?.role as MemberRole | undefined) ?? "owner");
      setLastSignIn(user.last_sign_in_at ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendPasswordReset = useCallback(async () => {
    if (!email) return;

    setSendingResetEmail(true);
    const supabase = createClient();
    const redirectTo = `${getAuthCallbackUrl()}?next=/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setSendingResetEmail(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t(language, "settings.security.passwordResetSent"));
  }, [email, language]);

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

  const handleDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);

    const result = await deleteAccount();

    if (!result.ok) {
      toast.error(result.error);
      setDeletingAccount(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    clearCachedWorkspaceId();
    toast.success(t(language, "settings.security.accountDeleted"));
    router.replace("/login");
  }, [language, router]);

  const formattedLastSignIn = lastSignIn
    ? formatDateTime(lastSignIn)
    : t(language, "settings.security.lastSignInUnknown");

  const deleteConfirmDescription =
    role === "owner"
      ? t(language, "settings.security.deleteAccountConfirmDescriptionOwner")
      : t(language, "settings.security.deleteAccountConfirmDescriptionMember");

  return (
    <>
      <SettingsSectionCard
        title={t(language, "settings.security.changePassword")}
        description={t(language, "settings.security.changePasswordDescription")}
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSendPasswordReset()}
            disabled={sendingResetEmail || !email}
          >
            {sendingResetEmail ? (
              <>
                <Loader2 className="animate-spin" />
                {t(language, "settings.security.sendingPasswordReset")}
              </>
            ) : (
              t(language, "settings.security.sendPasswordReset")
            )}
          </Button>
        }
      >
        <SettingsField label={t(language, "profile.email")}>
          <p className={cn(textStyle.bodyMedium, "text-foreground")}>{email}</p>
        </SettingsField>
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "settings.security.passwordResetHint")}
        </p>
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

      <SettingsSectionCard
        title={t(language, "settings.security.deleteAccount")}
        description={t(language, "settings.security.deleteAccountDescription")}
        footer={
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t(language, "settings.security.deleteAccount")}
          </Button>
        }
      >
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {deleteConfirmDescription}
        </p>
      </SettingsSectionCard>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t(language, "settings.security.deleteAccountConfirmTitle")}
            </DialogTitle>
            <DialogDescription>{deleteConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingAccount}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteAccount()}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t(language, "settings.security.deletingAccount")}
                </>
              ) : (
                t(language, "settings.security.deleteAccountConfirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
