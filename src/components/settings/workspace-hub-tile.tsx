"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  settingsHubSaveButtonClass,
  settingsHubTileBodyClass,
  settingsHubTileClass,
} from "@/lib/settings/hub-control-styles";
import {
  isRequired,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  normalizeWebsite,
} from "@/lib/settings/validation";
import { textStyle } from "@/lib/typography";
import { transition } from "@/lib/animation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getUserWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Workspace } from "@/types/database";

type WorkspaceForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  website: string;
};

type WorkspaceErrors = Partial<Record<keyof WorkspaceForm, string>>;

function buildMapsUrl(address: string, postalCode: string): string | null {
  const query = [address.trim(), postalCode.trim()].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildWebsiteHref(website: string): string | null {
  const trimmed = website.trim();
  if (!trimmed) return null;
  return normalizeWebsite(trimmed);
}

interface HubFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  disabled: boolean;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  href?: string | null;
  externalLink?: boolean;
  onChange: (value: string) => void;
}

function HubField({
  label,
  value,
  isEditing,
  disabled,
  error,
  type = "text",
  placeholder,
  autoComplete,
  href,
  externalLink = false,
  onChange,
}: HubFieldProps) {
  const linkClass = cn(
    textStyle.bodyMedium,
    "truncate text-foreground underline-offset-2 hover:underline"
  );

  return (
    <div className="flex flex-col gap-2">
      <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
        {label}
      </p>
      {isEditing ? (
        <Input
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : href ? (
        <a
          href={href}
          className={linkClass}
          target={externalLink ? "_blank" : undefined}
          rel={externalLink ? "noopener noreferrer" : undefined}
        >
          {value}
        </a>
      ) : value ? (
        <p className={cn(textStyle.bodyMedium, "truncate text-foreground")}>
          {value}
        </p>
      ) : (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>—</p>
      )}
      {error ? (
        <p className={cn(textStyle.caption, "text-destructive")}>{error}</p>
      ) : null}
    </div>
  );
}

export function WorkspaceHubTile() {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    website: "",
  });
  const [savedForm, setSavedForm] = useState<WorkspaceForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    website: "",
  });
  const [errors, setErrors] = useState<WorkspaceErrors>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const workspace = await getUserWorkspace(supabase);

      if (!workspace || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      const typed = workspace as Workspace;
      const nextForm: WorkspaceForm = {
        name: typed.name ?? "",
        email: typed.email ?? "",
        phone: typed.phone ?? "",
        address: typed.address ?? "",
        postalCode: typed.postal_code ?? "",
        website: typed.website ?? "",
      };

      setWorkspaceId(typed.id);
      setForm(nextForm);
      setSavedForm(nextForm);
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

  const handleCancel = useCallback(() => {
    setForm(savedForm);
    setErrors({});
    setIsEditing(false);
  }, [savedForm]);

  const handleSave = useCallback(async () => {
    if (!workspaceId || !validate()) return;

    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        postal_code: form.postalCode.trim() || null,
        website: form.website.trim() ? normalizeWebsite(form.website) : null,
      })
      .eq("id", workspaceId);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const nextForm: WorkspaceForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      postalCode: form.postalCode.trim(),
      website: form.website.trim() ? normalizeWebsite(form.website) : "",
    };

    setForm(nextForm);
    setSavedForm(nextForm);
    setErrors({});
    setIsEditing(false);
    toast.success(t(language, "settings.workspace.updated"));
  }, [form, language, validate, workspaceId]);

  const fieldsDisabled = loading || !isEditing;
  const mapsHref = buildMapsUrl(savedForm.address, savedForm.postalCode);
  const websiteHref = buildWebsiteHref(savedForm.website);
  const emailHref = savedForm.email
    ? `mailto:${savedForm.email.trim()}`
    : null;

  return (
    <Card
      data-dashboard-panel
      variant="nested"
      className={cn(settingsHubTileClass, "gap-5 overflow-hidden")}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className={textStyle.pageTitle}>
          {t(language, "settings.workspace.label")}
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
              language === "it" ? "Modifica workspace" : "Edit workspace"
            }
          >
            <Pencil className="size-4" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "settings.workspace.loading")}
        </p>
      ) : (
        <div className={cn(settingsHubTileBodyClass, "grid gap-4 sm:grid-cols-2")}>
          <div className="sm:col-span-2">
            <HubField
              label={t(language, "workspace.name")}
              value={form.name}
              isEditing={isEditing}
              disabled={fieldsDisabled}
              error={errors.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
            />
          </div>

          <HubField
            label={t(language, "workspace.generalEmail")}
            value={form.email}
            isEditing={isEditing}
            disabled={fieldsDisabled}
            error={errors.email}
            type="email"
            autoComplete="email"
            href={emailHref}
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
          />

          <HubField
            label={t(language, "profile.phone")}
            value={form.phone}
            isEditing={isEditing}
            disabled={fieldsDisabled}
            error={errors.phone}
            type="tel"
            autoComplete="tel"
            placeholder="+39 000 000 0000"
            onChange={(value) =>
              setForm((current) => ({ ...current, phone: value }))
            }
          />

          <HubField
            label={t(language, "settings.workspace.address")}
            value={form.address}
            isEditing={isEditing}
            disabled={fieldsDisabled}
            autoComplete="street-address"
            href={mapsHref}
            externalLink
            onChange={(value) =>
              setForm((current) => ({ ...current, address: value }))
            }
          />

          <HubField
            label={t(language, "settings.workspace.postalCode")}
            value={form.postalCode}
            isEditing={isEditing}
            disabled={fieldsDisabled}
            autoComplete="postal-code"
            href={mapsHref}
            externalLink
            onChange={(value) =>
              setForm((current) => ({ ...current, postalCode: value }))
            }
          />

          <div className="sm:col-span-2">
            <HubField
              label={t(language, "settings.workspace.website")}
              value={form.website}
              isEditing={isEditing}
              disabled={fieldsDisabled}
              error={errors.website}
              type="url"
              placeholder={t(language, "settings.workspace.websitePlaceholder")}
              href={websiteHref}
              externalLink
              onChange={(value) =>
                setForm((current) => ({ ...current, website: value }))
              }
            />
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
      ) : null}
    </Card>
  );
}
