"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSupplier } from "@/lib/suppliers/create-supplier";
import { getSupplierCompanyTypeOptions } from "@/lib/suppliers/supplier-types";
import { updateSupplier } from "@/lib/suppliers/update-supplier";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
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
import type { Supplier, SupplierCompanyType } from "@/types/database";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSupplierSaved: (supplier: Supplier) => void;
}

export function AddSupplierDialog({
  open,
  onOpenChange,
  supplier = null,
  onSupplierSaved,
}: AddSupplierDialogProps) {
  const language = useAppLanguage();
  const companyTypeOptions = getSupplierCompanyTypeOptions(language);
  const isEditing = supplier !== null;
  const [company, setCompany] = useState("");
  const [companyTypes, setCompanyTypes] = useState<SupplierCompanyType[]>([]);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (supplier) {
      setCompany(supplier.company);
      setCompanyTypes(supplier.company_types ?? []);
      setContactName(supplier.contact_name ?? "");
      setEmail(supplier.email ?? "");
      setPhone(supplier.phone ?? "");
      setWebsite(supplier.website ?? "");
      return;
    }

    setCompany("");
    setCompanyTypes([]);
    setContactName("");
    setEmail("");
    setPhone("");
    setWebsite("");
  }, [open, supplier]);

  const toggleCompanyType = useCallback((type: SupplierCompanyType) => {
    setCompanyTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedCompany = company.trim();
      if (!trimmedCompany) {
        toast.error(t(language, "suppliers.companyRequired"));
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
        company: trimmedCompany,
        companyTypes,
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      };

      const result = isEditing
        ? await updateSupplier({
            ...payload,
            supplierId: supplier.id,
          })
        : await createSupplier(payload);

      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      onSupplierSaved(result.supplier);
      onOpenChange(false);
      toast.success(
        isEditing
          ? t(language, "suppliers.updatedToast")
          : t(language, "suppliers.createdToast")
      );
    },
    [
      company,
      companyTypes,
      contactName,
      email,
      isEditing,
      language,
      onOpenChange,
      onSupplierSaved,
      phone,
      supplier,
      website,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t(language, "suppliers.editTitle")
              : t(language, "suppliers.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier-company">
              {language === "it" ? "Azienda" : "Company"}
            </Label>
            <Input
              id="supplier-company"
              placeholder={
                language === "it" ? "Inserisci nome azienda" : "Enter company name"
              }
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{language === "it" ? "Tipo azienda" : "Company type"}</Label>
            <div className="flex flex-wrap gap-2">
              {companyTypeOptions.map((option) => {
                const isSelected = companyTypes.includes(option.value);

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="xs"
                    disabled={saving}
                    className={
                      isSelected
                        ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                        : undefined
                    }
                    onClick={() => toggleCompanyType(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {language === "it"
                ? "Seleziona una o piu categorie."
                : "Select one or more categories."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier-contact-name">
              {language === "it" ? "Nome contatto" : "Contact name"}
            </Label>
            <Input
              id="supplier-contact-name"
              placeholder={
                language === "it" ? "Inserisci nome contatto" : "Enter contact name"
              }
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              placeholder={language === "it" ? "Inserisci email" : "Enter email"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier-phone">
              {language === "it" ? "Telefono" : "Phone number"}
            </Label>
            <Input
              id="supplier-phone"
              type="tel"
              placeholder={
                language === "it" ? "Inserisci telefono" : "Enter phone number"
              }
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="supplier-website">
              {language === "it" ? "Sito web" : "Website"}
            </Label>
            <Input
              id="supplier-website"
              type="text"
              inputMode="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
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
            <Button type="submit" disabled={saving || !company.trim()}>
              {saving
                ? isEditing
                  ? t(language, "common.saving")
                  : t(language, "common.creating")
                : isEditing
                  ? t(language, "common.saveChanges")
                  : t(language, "suppliers.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
