"use client";

import { Trash2, Unlink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getContactTypeLabel } from "@/lib/contacts/contact-types";
import { transition } from "@/lib/animation";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/database";

const contactRowGridClassName =
  "min-w-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-4";

const contactCellClassName = "min-w-0 truncate text-center";

const deleteButtonClassName = "size-9 shrink-0";

interface ContactListHeaderProps {
  className?: string;
}

export function ContactListHeader({ className }: ContactListHeaderProps) {
  const language = useAppLanguage();

  return (
    <div className={cn("hidden items-center gap-2 md:flex", className)}>
      <div
        className={cn(
          "grid",
          contactRowGridClassName,
          textStyle.captionMedium,
          "text-muted-foreground"
        )}
      >
        <span className={contactCellClassName}>
          {language === "it" ? "Nome" : "Name"}
        </span>
        <span className={contactCellClassName}>
          {language === "it" ? "Ruolo" : "Role"}
        </span>
        <span className={contactCellClassName}>
          {language === "it" ? "Azienda" : "Company"}
        </span>
        <span className={contactCellClassName}>Email</span>
        <span className={contactCellClassName}>
          {language === "it" ? "Telefono" : "Phone"}
        </span>
      </div>
      <span className={deleteButtonClassName} aria-hidden />
    </div>
  );
}

interface ContactCardProps {
  contact: Contact;
  onClick?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  deleteDisabled?: boolean;
  removeMode?: "delete" | "unlink";
}

function contactField(value: string | null | undefined, fallback = "—") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizePhoneHref(phone: string) {
  return phone.replace(/\s+/g, "");
}

interface ContactValueProps {
  value: string | null | undefined;
  href: string;
  className: string;
}

function ContactValue({ value, href, className }: ContactValueProps) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return <span className={className}>—</span>;
  }

  return (
    <a
      href={href}
      className={cn(className, "hover:text-foreground hover:underline")}
      onClick={(event) => event.stopPropagation()}
    >
      {trimmed}
    </a>
  );
}

export function ContactCard({
  contact,
  onClick,
  onDelete,
  deleteDisabled = false,
  removeMode = "delete",
}: ContactCardProps) {
  const language = useAppLanguage();
  const typeLabel = getContactTypeLabel(contact.type, language);
  const RemoveIcon = removeMode === "unlink" ? Unlink : Trash2;
  const removeAriaLabel =
    removeMode === "unlink"
      ? `Remove ${contact.name} from project`
      : `Delete contact ${contact.name}`;
  const company = contactField(contact.company);
  const email = contactField(contact.email);
  const phone = contactField(contact.phone);

  return (
    <Card variant={onClick ? "interactive" : "default"}>
      <CardContent className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-2 md:py-2.5">
        <div
          className={cn(
            "hidden md:grid",
            contactRowGridClassName,
            onClick && "cursor-pointer",
            onClick && transition.hover
          )}
          onClick={onClick ? () => onClick(contact) : undefined}
          onKeyDown={
            onClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick(contact);
                  }
                }
              : undefined
          }
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <span
            className={cn(
              textStyle.bodyMedium,
              contactCellClassName,
              "text-foreground"
            )}
            title={contact.name}
          >
            {contact.name}
          </span>

          <span
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "text-muted-foreground"
            )}
            title={typeLabel ?? undefined}
          >
            {contactField(typeLabel)}
          </span>

          <span className={cn(textStyle.caption, contactCellClassName, "text-muted-foreground")} title={contact.company ?? undefined}>
            {company}
          </span>

          <ContactValue
            value={contact.email}
            href={`mailto:${contact.email?.trim() ?? ""}`}
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "truncate text-muted-foreground"
            )}
          />

          <ContactValue
            value={contact.phone}
            href={`tel:${normalizePhoneHref(contact.phone?.trim() ?? "")}`}
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "truncate text-muted-foreground"
            )}
          />
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1 md:hidden",
            onClick && "cursor-pointer",
            onClick && transition.hover
          )}
          onClick={onClick ? () => onClick(contact) : undefined}
          onKeyDown={
            onClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick(contact);
                  }
                }
              : undefined
          }
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <span
            className={cn(textStyle.bodyMedium, "text-foreground")}
            title={contact.name}
          >
            {contact.name}
          </span>
          <span
            className={cn(textStyle.body, "text-muted-foreground")}
            title={typeLabel ?? undefined}
          >
            {contactField(typeLabel)}
          </span>
          <span
            className={cn(textStyle.body, "text-muted-foreground")}
            title={contact.company ?? undefined}
          >
            {company}
          </span>
          <ContactValue
            value={contact.email}
            href={`mailto:${contact.email?.trim() ?? ""}`}
            className={cn(textStyle.body, "break-all text-muted-foreground")}
          />
          <ContactValue
            value={contact.phone}
            href={`tel:${normalizePhoneHref(contact.phone?.trim() ?? "")}`}
            className={cn(textStyle.body, "text-muted-foreground")}
          />
        </div>

        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              deleteButtonClassName,
              "self-end md:self-auto",
              "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            )}
            aria-label={removeAriaLabel}
            disabled={deleteDisabled}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(contact);
            }}
          >
            <RemoveIcon className="size-4" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
