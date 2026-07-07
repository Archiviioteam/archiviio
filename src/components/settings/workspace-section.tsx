"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  buildLogoPath,
  getAssetSignedUrl,
  removeWorkspaceAsset,
  uploadWorkspaceAsset,
} from "@/lib/settings/upload-asset";
import {
  isRequired,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  normalizeWebsite,
} from "@/lib/settings/validation";
import { getUserWorkspace } from "@/lib/workspace";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/settings/image-upload-field";
import {
  SettingsField,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import type { Workspace } from "@/types/database";

type WorkspaceForm = {
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
};

type WorkspaceErrors = Partial<Record<keyof WorkspaceForm, string>>;

export function WorkspaceSection() {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceForm>({
    name: "",
    code: "",
    address: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    website: "",
  });
  const [errors, setErrors] = useState<WorkspaceErrors>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const workspace = await getUserWorkspace(supabase);

      if (!workspace) {
        if (!cancelled) setLoading(false);
        return;
      }

      const typedWorkspace = workspace as Workspace;
      const signedUrl = await getAssetSignedUrl(
        supabase,
        typedWorkspace.logo_url ?? null
      );

      if (cancelled) return;

      setWorkspaceId(typedWorkspace.id);
      setForm({
        name: typedWorkspace.name ?? "",
        code: typedWorkspace.code ?? "",
        address: typedWorkspace.address ?? "",
        city: typedWorkspace.city ?? "",
        country: typedWorkspace.country ?? "",
        email: typedWorkspace.email ?? "",
        phone: typedWorkspace.phone ?? "",
        website: typedWorkspace.website ?? "",
      });
      setLogoPath(typedWorkspace.logo_url ?? null);
      setLogoPreview(signedUrl);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: WorkspaceErrors = {};

    if (!isRequired(form.name)) {
      nextErrors.name = t(language, "settings.workspace.nameRequired");
    }

    if (form.email && !isValidEmail(form.email)) {
      nextErrors.email = t(language, "settings.workspace.emailInvalid");
    }

    if (!isValidPhone(form.phone)) {
      nextErrors.phone = t(language, "settings.workspace.phoneInvalid");
    }

    if (!isValidUrl(form.website)) {
      nextErrors.website = t(language, "settings.workspace.websiteInvalid");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, language]);

  const handleSave = useCallback(async () => {
    if (!workspaceId || !validate()) return;

    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: form.name.trim(),
        code: form.code.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim()
          ? normalizeWebsite(form.website)
          : null,
        logo_url: logoPath,
      })
      .eq("id", workspaceId);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    toast.success(t(language, "settings.workspace.updated"));
    window.setTimeout(() => setSaved(false), 2000);
  }, [form, language, logoPath, validate, workspaceId]);

  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (!workspaceId) return;

      setUploadingLogo(true);
      const supabase = createClient();
      const storagePath = buildLogoPath(workspaceId, file);
      const result = await uploadWorkspaceAsset(
        supabase,
        workspaceId,
        storagePath,
        file
      );

      if (!result.ok) {
        toast.error(result.error);
        setUploadingLogo(false);
        return;
      }

      setLogoPath(result.path);
      const signedUrl = await getAssetSignedUrl(supabase, result.path);
      setLogoPreview(signedUrl);
      setUploadingLogo(false);
      toast.success(t(language, "settings.workspace.logoUpdated"));
    },
    [language, workspaceId]
  );

  const handleLogoRemove = useCallback(async () => {
    if (!logoPath) {
      setLogoPreview(null);
      return;
    }

    const supabase = createClient();
    const result = await removeWorkspaceAsset(supabase, logoPath);

    if (!result.ok) {
      toast.error(result.error ?? t(language, "settings.workspace.logoRemoveFailed"));
      return;
    }

    setLogoPath(null);
    setLogoPreview(null);
    toast.success(t(language, "settings.workspace.logoRemoved"));
  }, [language, logoPath]);

  if (loading) {
    return (
      <p className={cn(textStyle.body, "text-muted-foreground")}>
        {t(language, "settings.workspace.loading")}
      </p>
    );
  }

  return (
    <SettingsSectionCard
        title={t(language, "settings.workspace.sectionTitle")}
        description={t(language, "settings.workspace.pageDescription")}
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
          label={t(language, "settings.workspace.logoLabel")}
          imageUrl={logoPreview}
          fallback={form.name.slice(0, 2) || "WS"}
          shape="square"
          uploading={uploadingLogo}
          onUpload={(file) => void handleLogoUpload(file)}
          onRemove={() => void handleLogoRemove()}
          hint={t(language, "settings.workspace.logoHint")}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsField
            label={t(language, "workspace.name")}
            htmlFor="workspace-name"
            error={errors.name}
          >
            <Input
              id="workspace-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </SettingsField>

          <SettingsField
            label={t(language, "settings.workspace.code")}
            htmlFor="workspace-code"
            hint={t(language, "settings.workspace.codeHint")}
          >
            <Input
              id="workspace-code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="STU-001"
            />
          </SettingsField>
        </div>

        <SettingsField label={t(language, "settings.workspace.address")} htmlFor="workspace-address">
          <Input
            id="workspace-address"
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            autoComplete="street-address"
          />
        </SettingsField>

        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsField label={t(language, "settings.workspace.city")} htmlFor="workspace-city">
            <Input
              id="workspace-city"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              autoComplete="address-level2"
            />
          </SettingsField>

          <SettingsField label={t(language, "settings.workspace.country")} htmlFor="workspace-country">
            <Input
              id="workspace-country"
              value={form.country}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  country: event.target.value,
                }))
              }
              autoComplete="country-name"
            />
          </SettingsField>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsField label={t(language, "profile.email")} htmlFor="workspace-email" error={errors.email}>
            <Input
              id="workspace-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              autoComplete="email"
            />
          </SettingsField>

          <SettingsField label={t(language, "profile.phone")} htmlFor="workspace-phone" error={errors.phone}>
            <Input
              id="workspace-phone"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              autoComplete="tel"
            />
          </SettingsField>
        </div>

        <SettingsField label={t(language, "settings.workspace.website")} htmlFor="workspace-website" error={errors.website}>
          <Input
            id="workspace-website"
            type="url"
            value={form.website}
            onChange={(event) =>
              setForm((current) => ({ ...current, website: event.target.value }))
            }
            placeholder={t(language, "settings.workspace.websitePlaceholder")}
          />
        </SettingsField>
      </SettingsSectionCard>
  );
}
