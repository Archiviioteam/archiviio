import { normalizeSearchQuery } from "@/lib/search/global-search";

export const RECENT_SEARCHES_STORAGE_KEY = "archiviio:recent-searches";
export const MAX_RECENT_SEARCHES = 10;

function parseStoredSearches(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const seen = new Set<string>();
    const searches: string[] = [];

    for (const item of parsed) {
      if (typeof item !== "string") {
        continue;
      }

      const normalized = normalizeSearchQuery(item);
      if (!normalized) {
        continue;
      }

      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      searches.push(normalized);

      if (searches.length >= MAX_RECENT_SEARCHES) {
        break;
      }
    }

    return searches;
  } catch {
    return [];
  }
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredSearches(
    window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
  );
}

export function writeRecentSearches(searches: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES))
  );
}

export function addRecentSearch(query: string): string[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return readRecentSearches();
  }

  const current = readRecentSearches().filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase()
  );

  const next = [normalized, ...current].slice(0, MAX_RECENT_SEARCHES);
  writeRecentSearches(next);
  return next;
}
