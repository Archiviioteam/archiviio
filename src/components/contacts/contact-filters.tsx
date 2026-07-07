"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";

interface ContactFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  onAddClick: () => void;
  onClearFilters: () => void;
}

export function ContactFilters({
  query,
  onQueryChange,
  onAddClick,
  onClearFilters,
}: ContactFiltersProps) {
  const language = useAppLanguage();
  const hasActiveFilters = query.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <SearchInput
          placeholder={
            language === "it"
              ? "Cerca per nome, azienda o tipo..."
              : "Search by name, company, or type..."
          }
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <Button type="button" onClick={onAddClick}>
          {t(language, "contacts.addTitle")}
        </Button>

        {hasActiveFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            {language === "it" ? "Pulisci filtri" : "Clear filters"}
          </Button>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}
      </div>
    </div>
  );
}
