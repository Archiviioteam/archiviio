"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  DOCUMENT_FILE_TYPE_FILTERS,
  type DocumentFileTypeFilter,
} from "@/lib/documents/document-file-types";

interface DocumentFiltersProps {
  search: string;
  selectedFileTypes: DocumentFileTypeFilter[];
  onSearchChange: (value: string) => void;
  onFileTypeToggle: (fileType: DocumentFileTypeFilter) => void;
  onAddClick: () => void;
  onClearFilters: () => void;
}

export function DocumentFilters({
  search,
  selectedFileTypes,
  onSearchChange,
  onFileTypeToggle,
  onAddClick,
  onClearFilters,
}: DocumentFiltersProps) {
  const hasActiveFilters =
    search.length > 0 || selectedFileTypes.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <SearchInput
          placeholder="Search by name or type..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <Button type="button" onClick={onAddClick}>
          Add file
        </Button>

        {hasActiveFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          File type
        </span>
        {DOCUMENT_FILE_TYPE_FILTERS.map((fileType) => {
          const isSelected = selectedFileTypes.includes(fileType.id);

          return (
            <Button
              key={fileType.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="xs"
              aria-pressed={isSelected}
              onClick={() => onFileTypeToggle(fileType.id)}
              className={
                isSelected
                  ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : undefined
              }
            >
              {fileType.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
