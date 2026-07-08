"use client";

import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { getSupplierCompanyTypeOptions } from "@/lib/suppliers/supplier-types";
import { transition } from "@/lib/animation";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { SupplierCompanyType } from "@/types/database";

const selectClassName = cn(
  "flex h-12 min-w-[10rem] cursor-pointer appearance-none border border-input bg-card px-3 py-2 pr-10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

interface SupplierFiltersProps {
  query: string;
  companyType: SupplierCompanyType | null;
  inMaterialLibrary: boolean | null;
  onQueryChange: (value: string) => void;
  onCompanyTypeChange: (value: SupplierCompanyType | null) => void;
  onMaterialLibraryChange: (value: boolean | null) => void;
  onAddClick: () => void;
}

export function SupplierFilters({
  query,
  companyType,
  inMaterialLibrary,
  onQueryChange,
  onCompanyTypeChange,
  onMaterialLibraryChange,
  onAddClick,
}: SupplierFiltersProps) {
  const language = useAppLanguage();
  const companyTypeOptions = getSupplierCompanyTypeOptions(language);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        placeholder={
          language === "it"
            ? "Cerca per azienda, contatto o email..."
            : "Search by company, contact, or email..."
        }
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-w-0 w-full flex-1"
      />

      <div className="relative w-full shrink-0 sm:w-auto">
        <select
          value={companyType ?? ""}
          onChange={(event) =>
            onCompanyTypeChange(
              (event.target.value as SupplierCompanyType) || null
            )
          }
          className={cn(selectClassName, "w-full sm:w-auto")}
          aria-label={language === "it" ? "Filtra per categoria" : "Filter by category"}
        >
          <option value="">{language === "it" ? "Tutte le categorie" : "All categories"}</option>
          {companyTypeOptions.map((option) => (
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

      <div className="relative w-full shrink-0 sm:w-auto">
        <select
          value={
            inMaterialLibrary === null
              ? ""
              : inMaterialLibrary
                ? "true"
                : "false"
          }
          onChange={(event) => {
            const value = event.target.value;
            onMaterialLibraryChange(
              value === "" ? null : value === "true"
            );
          }}
          className={cn(selectClassName, "w-full sm:w-auto")}
          aria-label={t(language, "suppliers.filterAllSamples")}
        >
          <option value="">{t(language, "suppliers.filterAllSamples")}</option>
          <option value="true">
            {t(language, "suppliers.filterSamplesInLibrary")}
          </option>
          <option value="false">
            {t(language, "suppliers.filterSamplesNotInLibrary")}
          </option>
        </select>
        <ChevronsUpDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      <Button type="button" onClick={onAddClick} className="w-full shrink-0 sm:w-auto">
        {t(language, "suppliers.addTitle")}
      </Button>
    </div>
  );
}
