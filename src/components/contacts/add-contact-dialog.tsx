"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getContactTypeOptions } from "@/lib/contacts/contact-types";
import { createContact } from "@/lib/contacts/create-contact";
import { updateContact } from "@/lib/contacts/update-contact";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Contact, ContactType } from "@/types/database";

const selectClassName = cn(
  "flex h-12 w-full cursor-pointer appearance-none border border-input bg-card px-3 py-2 pr-10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onContactSaved: (contact: Contact) => void;
}

export function AddContactDialog({
  open,
  onOpenChange,
  contact = null,
  onContactSaved,
}: AddContactDialogProps) {
  const language = useAppLanguage();
  const contactTypeOptions = getContactTypeOptions(language);
  const isEditing = contact !== null;
  const [name, setName] = useState("");
  const [type, setType] = useState<ContactType>("altro");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (contact) {
      setName(contact.name);
      setType(contact.type ?? "altro");
      setCompany(contact.company ?? "");
      setEmail(contact.email ?? "");
      setPhone(contact.phone ?? "");
      return;
    }

    setName("");
    setType("altro");
    setCompany("");
    setEmail("");
    setPhone("");
  }, [open, contact]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error(t(language, "contacts.nameRequired"));
        return;
      }

      setSaving(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(t(language, "common.workspaceNotFound"));
        setSaving(false);
        return;
      }

      const payload = {
        supabase,
        workspaceId,
        name: trimmedName,
        type,
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      };

      const result = isEditing
        ? await updateContact({
            ...payload,
            contactId: contact.id,
          })
        : await createContact(payload);

      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      onContactSaved(result.contact);
      onOpenChange(false);
      toast.success(
        isEditing
          ? t(language, "contacts.updatedToast")
          : t(language, "contacts.createdToast")
      );
    },
    [
      company,
      contact,
      email,
      isEditing,
      language,
      name,
      onContactSaved,
      onOpenChange,
      phone,
      type,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t(language, "contacts.editTitle")
              : t(language, "contacts.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">
              {language === "it" ? "Nome" : "Name"}
            </Label>
            <Input
              id="contact-name"
              autoFocus
              placeholder={language === "it" ? "Inserisci nome" : "Enter name"}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-role">
              {language === "it" ? "Ruolo" : "Role"}
            </Label>
            <div className="relative">
              <select
                id="contact-role"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as ContactType)
                }
                disabled={saving}
                className={selectClassName}
              >
                {contactTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-company">
              {language === "it" ? "Azienda" : "Company"}
            </Label>
            <Input
              id="contact-company"
              placeholder={
                language === "it" ? "Inserisci azienda" : "Enter company"
              }
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder={language === "it" ? "Inserisci email" : "Enter email"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-phone">
              {language === "it" ? "Telefono" : "Phone number"}
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder={
                language === "it" ? "Inserisci telefono" : "Enter phone number"
              }
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving
                ? isEditing
                  ? t(language, "common.saving")
                  : t(language, "common.creating")
                : isEditing
                  ? t(language, "common.saveChanges")
                  : t(language, "contacts.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
