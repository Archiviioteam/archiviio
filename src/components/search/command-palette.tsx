"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  FileText,
  FolderKanban,
  Hash,
  Search,
  Tag,
  Truck,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadDocumentDialog } from "@/components/search/upload-document-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { createClient } from "@/lib/supabase/client";
import { useNavOrder } from "@/lib/layout/use-nav-order";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { globalSearch, normalizeSearchQuery } from "@/lib/search/global-search";
import {
  addRecentSearch,
  readRecentSearches,
} from "@/lib/search/recent-searches-storage";
import {
  filterQuickActions,
  getQuickActions,
  type QuickAction,
  type QuickActionId,
} from "@/lib/search/quick-actions";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import type {
  GlobalSearchResult,
  GlobalSearchResults,
} from "@/lib/search/types";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

const searchResultIcons = {
  project: FolderKanban,
  project_code: Hash,
  contact: User,
  supplier: Truck,
  document: FileText,
  tag: Tag,
  nomenclature: BookOpen,
} as const;

function ResultButton({
  result,
  onSelect,
}: {
  result: GlobalSearchResult;
  onSelect: () => void;
}) {
  const Icon = searchResultIcons[result.type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        radius.control,
        "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate text-foreground", textStyle.bodyMedium)}>
          {result.title}
        </span>
        {result.subtitle ? (
          <span className={cn("truncate text-muted-foreground", textStyle.caption)}>
            {result.subtitle}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ResultsSection({
  heading,
  results,
  onSelect,
}: {
  heading: string;
  results: GlobalSearchResult[];
  onSelect: (result: GlobalSearchResult) => void;
}) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="py-1">
      <p
        className={cn(
          "px-3 py-1.5 text-muted-foreground",
          textStyle.captionMedium
        )}
      >
        {heading}
      </p>
      {results.map((result) => (
        <ResultButton
          key={`${result.type}-${result.id}`}
          result={result}
          onSelect={() => onSelect(result)}
        />
      ))}
    </div>
  );
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps = {}) {
  const router = useRouter();
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const { items: primaryNavItems } = useNavOrder(language);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(
    null
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const rememberSearch = useCallback((value: string) => {
    setRecentSearches(addRecentSearch(value));
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSearchResults(null);
    setSearchError(null);
  }, [setOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      closePalette();
      command();
    },
    [closePalette]
  );

  const executeQuickAction = useCallback(
    (actionId: QuickActionId) => {
      switch (actionId) {
        case "create-project":
          runCommand(() => router.push("/projects?action=create"));
          break;
        case "create-contact":
          runCommand(() => router.push("/contacts?action=create"));
          break;
        case "upload-document":
          closePalette();
          setUploadDialogOpen(true);
          break;
        case "create-supplier":
          runCommand(() => router.push("/suppliers?action=create"));
          break;
      }
    },
    [closePalette, router, runCommand]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults(null);
      setSearching(false);
      setSearchError(null);
      return;
    }

    setRecentSearches(readRecentSearches());
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
      setSearchResults(null);
      setSearching(false);
      setSearchError(null);
      return;
    }

    setSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const response = await globalSearch(supabase, normalizedQuery);
        setSearchResults(response.results);
      } catch {
        setSearchResults(null);
        setSearchError(t(language, "search.error"));
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [language, query]);

  const quickActions = filterQuickActions(query, language);
  const hasSearchQuery = normalizeSearchQuery(query) !== null;
  const searchTotal = searchResults
    ? Object.values(searchResults).reduce((sum, group) => sum + group.length, 0)
    : 0;
  const showEmptyState =
    hasSearchQuery && !searching && !searchError && searchTotal === 0;

  function handleSearchResultSelect(result: GlobalSearchResult) {
    const normalizedQuery = normalizeSearchQuery(query);
    if (normalizedQuery) {
      rememberSearch(normalizedQuery);
    }

    runCommand(() => router.push(result.href));
  }

  function renderQuickAction(action: QuickAction) {
    const Icon = action.icon;

    return (
      <button
        key={action.id}
        type="button"
        onClick={() => executeQuickAction(action.id)}
        className={cn(
          radius.control,
          "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className={textStyle.body}>{action.label}</span>
      </button>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md gap-0 overflow-hidden p-0"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t(language, "search.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "search.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-border p-3">
            <div
              className={cn(
                radius.pill,
                "flex h-12 items-center gap-2 border border-input bg-card px-4"
              )}
            >
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(language, "search.placeholder")}
                className={cn(
                  radius.pill,
                  "h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                )}
                aria-label={t(language, "search.trigger")}
              />
            </div>
          </div>

          <div className="max-h-[min(24rem,50dvh)] overflow-y-auto p-1">
            {searching ? (
              <p
                className={cn(
                  "px-3 py-6 text-center text-muted-foreground",
                  textStyle.body
                )}
              >
                {t(language, "search.running")}
              </p>
            ) : null}

            {searchError ? (
              <p
                className={cn(
                  "px-3 py-6 text-center text-destructive",
                  textStyle.body
                )}
              >
                {searchError}
              </p>
            ) : null}

            {showEmptyState ? (
              <div className="px-2 py-4">
                <EmptyState
                  compact
                  icon={emptyStatePresets.search.icon}
                  title={emptyStatePresets.search.title}
                  action={{
                    label: emptyStatePresets.search.actionLabel,
                    onClick: () => setQuery(""),
                  }}
                />
              </div>
            ) : null}

            {searchResults ? (
              <>
                <ResultsSection
                  heading={t(language, "search.projects")}
                  results={searchResults.projects}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.projectCodes")}
                  results={searchResults.projectCodes}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.contacts")}
                  results={searchResults.contacts}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.suppliers")}
                  results={searchResults.suppliers}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.documents")}
                  results={searchResults.documents}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.tags")}
                  results={searchResults.tags}
                  onSelect={handleSearchResultSelect}
                />
                <ResultsSection
                  heading={t(language, "search.nomenclature")}
                  results={searchResults.nomenclatures}
                  onSelect={handleSearchResultSelect}
                />
              </>
            ) : null}

            {!hasSearchQuery && getQuickActions(language).length > 0 ? (
              <div className="py-1">
                <p
                  className={cn(
                    "px-3 py-1.5 text-muted-foreground",
                    textStyle.captionMedium
                  )}
                >
                  {t(language, "search.quickActions")}
                </p>
                {quickActions.map(renderQuickAction)}
              </div>
            ) : null}

            {!hasSearchQuery && recentSearches.length > 0 ? (
              <div className="border-t border-border py-1">
                <p
                  className={cn(
                    "px-3 py-1.5 text-muted-foreground",
                    textStyle.captionMedium
                  )}
                >
                  {t(language, "search.recent")}
                </p>
                {recentSearches.map((recentQuery) => (
                  <button
                    key={recentQuery}
                    type="button"
                    onClick={() => {
                      setQuery(recentQuery);
                      rememberSearch(recentQuery);
                    }}
                    className={cn(
                      radius.control,
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
                    )}
                  >
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className={textStyle.body}>{recentQuery}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!hasSearchQuery ? (
              <div className="border-t border-border py-1">
                <p
                  className={cn(
                    "px-3 py-1.5 text-muted-foreground",
                    textStyle.captionMedium
                  )}
                >
                  {t(language, "search.navigation")}
                </p>
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => runCommand(() => router.push(item.href))}
                      className={cn(
                        radius.control,
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className={textStyle.body}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
}
