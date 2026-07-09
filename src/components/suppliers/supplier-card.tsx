"use client";

import { Globe, Mail, Phone, Trash2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupplierCompanyTypeLabel } from "@/lib/suppliers/supplier-types";
import { transition } from "@/lib/animation";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/types/database";

const deleteButtonClassName = "size-9 shrink-0";

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  deleteDisabled?: boolean;
  removeMode?: "delete" | "unlink";
}

function formatWebsiteDisplay(website: string): string {
  return website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function normalizeWebsiteHref(website: string): string {
  const trimmed = website.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizePhoneHref(phone: string): string {
  return phone.replace(/\s+/g, "");
}

interface ContactRowProps {
  icon: typeof Mail;
  value: string;
  href?: string;
  openInNewTab?: boolean;
}

function ContactRow({
  icon: Icon,
  value,
  href,
  openInNewTab = false,
}: ContactRowProps) {
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <span className={cn(textStyle.body, "break-all text-muted-foreground md:truncate")}>
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noreferrer" : undefined}
        className="flex min-w-0 items-center gap-2 hover:text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return <div className="flex min-w-0 items-center gap-2">{content}</div>;
}

export function SupplierCard({
  supplier,
  onClick,
  onDelete,
  deleteDisabled = false,
  removeMode = "delete",
}: SupplierCardProps) {
  const language = useAppLanguage();
  const RemoveIcon = removeMode === "unlink" ? Unlink : Trash2;
  const removeAriaLabel =
    removeMode === "unlink"
      ? `Remove ${supplier.company} from project`
      : `Delete supplier ${supplier.company}`;
  const contactName = supplier.contact_name?.trim();
  const email = supplier.email?.trim();
  const phone = supplier.phone?.trim();
  const website = supplier.website?.trim();
  const hasBadges =
    supplier.in_material_library || supplier.company_types.length > 0;

  const badges = (
    <>
      {supplier.in_material_library ? (
        <Badge variant="secondary" size="lg">
          {t(language, "suppliers.materialLibraryBadge")}
        </Badge>
      ) : null}
      {supplier.company_types.map((type) => (
        <Badge key={type} variant="muted" size="lg">
          {getSupplierCompanyTypeLabel(type, language)}
        </Badge>
      ))}
    </>
  );

  return (
    <Card
      variant={onClick ? "interactive" : "default"}
      className={cn(
        "flex flex-col gap-4 border border-border p-5",
        onClick && "cursor-pointer",
        transition.hover
      )}
      onClick={onClick ? () => onClick(supplier) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick(supplier);
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              textStyle.bodyMedium,
              "font-semibold text-foreground md:truncate"
            )}
            title={supplier.company}
          >
            {supplier.company}
          </p>
          {contactName ? (
            <p
              className={cn(
                textStyle.body,
                "mt-1 text-muted-foreground md:truncate"
              )}
              title={contactName}
            >
              {contactName}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasBadges ? (
            <div className="hidden max-w-[10rem] flex-wrap justify-end gap-1.5 md:flex">
              {badges}
            </div>
          ) : null}

          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                deleteButtonClassName,
                "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              )}
              aria-label={removeAriaLabel}
              disabled={deleteDisabled}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(supplier);
              }}
            >
              <RemoveIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {(email || phone || website) && (
        <div className="flex flex-col gap-2.5">
          {email ? <ContactRow icon={Mail} value={email} href={`mailto:${email}`} /> : null}
          {phone ? (
            <ContactRow icon={Phone} value={phone} href={`tel:${normalizePhoneHref(phone)}`} />
          ) : null}
          {website ? (
            <ContactRow
              icon={Globe}
              value={formatWebsiteDisplay(website)}
              href={normalizeWebsiteHref(website)}
              openInNewTab
            />
          ) : null}
        </div>
      )}

      {hasBadges ? (
        <div className="flex flex-wrap gap-1.5 md:hidden">{badges}</div>
      ) : null}
    </Card>
  );
}
