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
  onQueryChange: (value: string) => void;
  onCompanyTypeChange: (value: SupplierCompanyType | null) => void;
  onAddClick: () => void;
}

export function SupplierFilters({
  query,
  companyType,
  onQueryChange,
  onCompanyTypeChange,
  onAddClick,
}: SupplierFiltersProps) {
  const language = useAppLanguage();
  const companyTypeOptions = getSupplierCompanyTypeOptions(language);

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <SearchInput
        placeholder={
          language === "it"
            ? "Cerca per azienda, contatto o email..."
            : "Search by company, contact, or email..."
        }
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-w-0 flex-1"
      />

      <div className="relative shrink-0">
        <select
          value={companyType ?? ""}
          onChange={(event) =>
            onCompanyTypeChange(
              (event.target.value as SupplierCompanyType) || null
            )
          }
          className={selectClassName}
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

      <Button type="button" onClick={onAddClick} className="shrink-0">
        {t(language, "suppliers.addTitle")}
      </Button>
    </div>
  );
}
