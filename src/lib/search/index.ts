export { globalSearch, flattenSearchResults, normalizeSearchQuery } from "@/lib/search/global-search";
export {
  buildFuzzyIlikeOrFilter,
  expandQueryVariants,
  fuzzyMatchesProjectCode,
  fuzzyMatchesSubsequence,
  fuzzyMatchesText,
} from "@/lib/search/fuzzy-search";
export {
  filterQuickActions,
  quickActionSearchValue,
  QUICK_ACTIONS,
} from "@/lib/search/quick-actions";
export type { QuickAction, QuickActionId } from "@/lib/search/quick-actions";
export {
  addRecentSearch,
  MAX_RECENT_SEARCHES,
  readRecentSearches,
  RECENT_SEARCHES_STORAGE_KEY,
  writeRecentSearches,
} from "@/lib/search/recent-searches-storage";
export {
  contactHref,
  documentHref,
  nomenclatureHref,
  projectHref,
  supplierHref,
  tagHref,
} from "@/lib/search/search-routes";
export type {
  GlobalSearchOptions,
  GlobalSearchResponse,
  GlobalSearchResult,
  GlobalSearchResults,
  GlobalSearchResultType,
} from "@/lib/search/types";
