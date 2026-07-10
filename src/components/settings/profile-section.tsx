"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  buildAvatarPath,
  getAssetSignedUrl,
  removeWorkspaceAsset,
  uploadWorkspaceAsset,
} from "@/lib/settings/upload-asset";
import {
  isRequired,
  isValidEmail,
  isValidPhone,
  joinFullName,
  splitFullName,
} from "@/lib/settings/validation";
import { getWorkspaceId } from "@/lib/workspace";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/settings/image-upload-field";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import type { MemberRole, User } from "@/types/database";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
};

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

function roleLabel(role: MemberRole, language: AppLanguage): string {
  return role === "owner"
    ? t(language, "team.roleOwner")
    : t(language, "team.roleMember");
}

export function ProfileSection() {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [role, setRole] = useState<MemberRole>("owner");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [errors, setErrors] = useState<ProfileErrors>({});

  const fallback = useMemo(() => {
    const initials = [form.firstName, form.lastName]
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .join("");
    return initials || form.email[0] || "?";
  }, [form.email, form.firstName, form.lastName]);

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

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      const typedProfile = profile as User | null;
      const names = splitFullName(typedProfile?.full_name ?? null);
      const signedUrl = await getAssetSignedUrl(
        supabase,
        typedProfile?.avatar_url ?? null
      );

      if (cancelled) return;

      setForm({
        firstName: typedProfile?.first_name ?? names.firstName,
        lastName: typedProfile?.last_name ?? names.lastName,
        email: typedProfile?.email ?? user.email ?? "",
        phone: typedProfile?.phone ?? "",
        bio: typedProfile?.bio ?? "",
      });
      setRole(typedProfile?.role ?? "owner");
      setAvatarPath(typedProfile?.avatar_url ?? null);
      setAvatarPreview(signedUrl);
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

    if (!isValidEmail(form.email)) {
      nextErrors.email = t(language, "settings.profile.emailInvalid");
    }

    if (!isValidPhone(form.phone)) {
      nextErrors.phone = t(language, "settings.profile.phoneInvalid");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, language]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    setSaved(false);

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
        bio: form.bio.trim() || null,
        avatar_url: avatarPath,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    if (user.email !== form.email.trim()) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: form.email.trim(),
      });

      if (emailError) {
        toast.error(emailError.message);
        setSaving(false);
        return;
      }

      toast.message(t(language, "settings.profile.emailConfirm"));
    }

    setSaving(false);
    setSaved(true);
    toast.success(t(language, "settings.profile.updated"));
    window.setTimeout(() => setSaved(false), 2000);
  }, [avatarPath, form, language, validate]);

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      setUploadingAvatar(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!workspaceId || !user) {
        toast.error(t(language, "common.workspaceNotFound"));
        setUploadingAvatar(false);
        return;
      }

      const storagePath = buildAvatarPath(workspaceId, user.id, file);
      const result = await uploadWorkspaceAsset(
        supabase,
        workspaceId,
        storagePath,
        file
      );

      if (!result.ok) {
        toast.error(result.error);
        setUploadingAvatar(false);
        return;
      }

      setAvatarPath(result.path);
      const signedUrl = await getAssetSignedUrl(supabase, result.path);
      setAvatarPreview(signedUrl);
      setUploadingAvatar(false);
      toast.success(t(language, "settings.profile.photoUpdated"));
    },
    [language]
  );

  const handleAvatarRemove = useCallback(async () => {
    if (!avatarPath) {
      setAvatarPreview(null);
      return;
    }

    const supabase = createClient();
    const result = await removeWorkspaceAsset(supabase, avatarPath);

    if (!result.ok) {
      toast.error(result.error ?? t(language, "settings.profile.photoRemoveFailed"));
      return;
    }

    setAvatarPath(null);
    setAvatarPreview(null);
    toast.success(t(language, "settings.profile.photoRemoved"));
  }, [avatarPath, language]);

  if (loading) {
    return (
      <p className={cn(textStyle.body, "text-muted-foreground")}>
        {t(language, "settings.profile.loading")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsSectionCard
        title={t(language, "settings.profile.sectionTitle")}
        description={t(language, "settings.profile.pageDescription")}
        footer={
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                {t(language, "common.saving")}
              </>
            ) : saved ? (
              <>
                <Check />
                {t(language, "common.saved")}
              </>
            ) : (
              t(language, "common.saveChanges")
            )}
          </Button>
        }
      >
        <ImageUploadField
          label={t(language, "settings.profile.photoLabel")}
          imageUrl={avatarPreview}
          fallback={fallback}
          uploading={uploadingAvatar}
          onUpload={(file) => void handleAvatarUpload(file)}
          onRemove={() => void handleAvatarRemove()}
          hint={t(language, "settings.profile.photoHint")}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsField label={t(language, "profile.firstName")} htmlFor="first-name" error={errors.firstName}>
            <Input
              id="first-name"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              autoComplete="given-name"
            />
          </SettingsField>

          <SettingsField label={t(language, "profile.lastName")} htmlFor="last-name" error={errors.lastName}>
            <Input
              id="last-name"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              autoComplete="family-name"
            />
          </SettingsField>
        </div>

        <SettingsField label={t(language, "profile.email")} htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            autoComplete="email"
          />
        </SettingsField>

        <SettingsField label={t(language, "profile.phone")} htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            autoComplete="tel"
            placeholder="+39 000 000 0000"
          />
        </SettingsField>

        <SettingsField label={t(language, "settings.profile.role")} hint={t(language, "settings.profile.roleHint")}>
          <Input value={roleLabel(role, language)} disabled readOnly />
        </SettingsField>

        <SettingsField label={t(language, "settings.profile.bio")} htmlFor="bio">
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(event) =>
              setForm((current) => ({ ...current, bio: event.target.value }))
            }
            placeholder={t(language, "settings.profile.bioPlaceholder")}
            maxLength={280}
          />
        </SettingsField>
      </SettingsSectionCard>
    </div>
  );
}
