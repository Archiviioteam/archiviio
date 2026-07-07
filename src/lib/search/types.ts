export type GlobalSearchResultType =
  | "project"
  | "project_code"
  | "contact"
  | "supplier"
  | "document"
  | "tag"
  | "nomenclature";

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface GlobalSearchResults {
  projects: GlobalSearchResult[];
  projectCodes: GlobalSearchResult[];
  contacts: GlobalSearchResult[];
  suppliers: GlobalSearchResult[];
  documents: GlobalSearchResult[];
  tags: GlobalSearchResult[];
  nomenclatures: GlobalSearchResult[];
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchResults;
  total: number;
}

export interface GlobalSearchOptions {
  limit?: number;
  tagScanLimit?: number;
}
