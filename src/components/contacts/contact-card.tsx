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
  "grid min-w-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-4";

const contactCellClassName = "min-w-0 truncate text-center";

const deleteButtonClassName = "size-9 shrink-0";

interface ContactListHeaderProps {
  className?: string;
}

export function ContactListHeader({ className }: ContactListHeaderProps) {
  const language = useAppLanguage();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
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

  return (
    <Card variant={onClick ? "interactive" : "default"}>
      <CardContent className="flex items-center gap-2 px-4 py-2.5">
        <div
          className={cn(
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

          <span
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "text-muted-foreground"
            )}
            title={contact.company ?? undefined}
          >
            {contactField(contact.company)}
          </span>

          <span
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "text-muted-foreground"
            )}
            title={contact.email ?? undefined}
          >
            {contactField(contact.email)}
          </span>

          <span
            className={cn(
              textStyle.caption,
              contactCellClassName,
              "text-muted-foreground"
            )}
            title={contact.phone ?? undefined}
          >
            {contactField(contact.phone)}
          </span>
        </div>

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
