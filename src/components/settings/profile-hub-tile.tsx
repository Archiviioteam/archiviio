"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { transition } from "@/lib/animation";
import {
  settingsHubSaveButtonClass,
  settingsHubTileBodyClass,
  settingsHubTileClass,
} from "@/lib/settings/hub-control-styles";
import { settingsSectionHref } from "@/lib/settings/constants";
import {
  isRequired,
  isValidPhone,
  joinFullName,
  splitFullName,
} from "@/lib/settings/validation";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "@/types/database";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

export function ProfileHubTile() {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [savedForm, setSavedForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<ProfileErrors>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("first_name,last_name,email,phone,full_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const typed = data as Pick<
        User,
        "first_name" | "last_name" | "email" | "phone" | "full_name"
      > | null;
      const names = splitFullName(typed?.full_name ?? null);
      const nextForm: ProfileForm = {
        firstName: typed?.first_name ?? names.firstName,
        lastName: typed?.last_name ?? names.lastName,
        email: typed?.email ?? user.email ?? "",
        phone: typed?.phone ?? "",
      };

      setForm(nextForm);
      setSavedForm(nextForm);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: ProfileErrors = {};

    if (!isRequired(form.firstName)) {
      nextErrors.firstName = t(language, "settings.profile.firstNameRequired");
    }

    if (!isValidPhone(form.phone)) {
      nextErrors.phone = t(language, "settings.profile.phoneInvalid");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, language]);

  const handleCancel = useCallback(() => {
    setForm(savedForm);
    setErrors({});
    setIsEditing(false);
  }, [savedForm]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t(language, "common.notAuthenticated"));
      setSaving(false);
      return;
    }

    const fullName = joinFullName(form.firstName, form.lastName);
    const { error } = await supabase
      .from("users")
      .update({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        full_name: fullName || null,
        phone: form.phone.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const nextForm = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: savedForm.email,
      phone: form.phone.trim(),
    };

    setForm(nextForm);
    setSavedForm(nextForm);
    setErrors({});
    setIsEditing(false);
    toast.success(t(language, "settings.profile.updated"));
  }, [form, language, savedForm.email, validate]);

  const fieldsDisabled = loading || !isEditing;

  return (
    <Card
      data-dashboard-panel
      variant="nested"
      className={cn(settingsHubTileClass, "justify-between gap-5 overflow-hidden")}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className={textStyle.pageTitle}>
          {t(language, "settings.profile.label")}
        </span>
        {!loading && !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground",
              transition.hover,
              "hover:bg-muted hover:text-foreground"
            )}
            aria-label={
              language === "it" ? "Modifica profilo" : "Edit profile"
            }
          >
            <Pencil className="size-4" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "settings.profile.loading")}
        </p>
      ) : (
        <div className={cn(settingsHubTileBodyClass, "grid gap-4 sm:grid-cols-2")}>
          <div className="flex flex-col gap-2">
            <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
              {t(language, "profile.firstName")}
            </p>
            <Input
              value={form.firstName}
              disabled={fieldsDisabled}
              readOnly={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
            />
            {errors.firstName ? (
              <p className={cn(textStyle.caption, "text-destructive")}>
                {errors.firstName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
              {t(language, "profile.lastName")}
            </p>
            <Input
              value={form.lastName}
              disabled={fieldsDisabled}
              readOnly={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              autoComplete="family-name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
              {t(language, "profile.email")}
            </p>
            <Input
              value={form.email}
              type="email"
              disabled
              readOnly
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
              {t(language, "profile.phone")}
            </p>
            <Input
              value={form.phone}
              type="tel"
              disabled={fieldsDisabled}
              readOnly={!isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              autoComplete="tel"
              placeholder="+39 000 000 0000"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? (
              <p className={cn(textStyle.caption, "text-destructive")}>
                {errors.phone}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            {t(language, "common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className={settingsHubSaveButtonClass}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                {t(language, "common.saving")}
              </>
            ) : (
              t(language, "common.saveChanges")
            )}
          </Button>
        </div>
      ) : !loading ? (
        <Link
          href={settingsSectionHref("profile")}
          className={cn(
            textStyle.captionMedium,
            "text-muted-foreground",
            transition.hover,
            "hover:text-foreground"
          )}
        >
          {t(language, "profile.manage")}
        </Link>
      ) : null}
    </Card>
  );
}
