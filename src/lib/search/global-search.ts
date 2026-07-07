import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDocumentTag } from "@/lib/documents/document-tags";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { projectsHaveLocationColumn } from "@/lib/projects/schema";
import {
  buildFuzzyIlikeOrFilter,
  fuzzyMatchesProjectCode,
  fuzzyMatchesText,
  ilikePattern,
} from "@/lib/search/fuzzy-search";
import {
  contactHref,
  documentHref,
  nomenclatureHref,
  projectHref,
  supplierHref,
  tagHref,
} from "@/lib/search/search-routes";
import type {
  GlobalSearchOptions,
  GlobalSearchResponse,
  GlobalSearchResult,
  GlobalSearchResults,
} from "@/lib/search/types";

const DEFAULT_LIMIT = 8;
const DEFAULT_TAG_SCAN_LIMIT = 100;

type TaggedRow = {
  id: string;
  tags: string[] | null;
};

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  location: string | null;
};

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  tags: string[] | null;
};

type SupplierRow = {
  id: string;
  company: string;
  contact_name: string | null;
  email: string | null;
  company_types: string[] | null;
  tags: string[] | null;
};

type DocumentRow = {
  id: string;
  name: string;
  file_type: string | null;
  project_id: string | null;
  tags: string[] | null;
  projects: { name: string; code: string } | { name: string; code: string }[] | null;
};

type NomenclatureRow = {
  id: string;
  project_id: string;
  content: string;
  projects: { name: string; code: string } | { name: string; code: string }[] | null;
};

function emptyResults(): GlobalSearchResults {
  return {
    projects: [],
    projectCodes: [],
    contacts: [],
    suppliers: [],
    documents: [],
    tags: [],
    nomenclatures: [],
  };
}

function countResults(results: GlobalSearchResults): number {
  return (
    results.projects.length +
    results.projectCodes.length +
    results.contacts.length +
    results.suppliers.length +
    results.documents.length +
    results.tags.length +
    results.nomenclatures.length
  );
}

export function normalizeSearchQuery(query: string): string | null {
  const normalized = query.trim();
  return normalized.length > 0 ? normalized : null;
}

function ilikeOrFilter(columns: string[], query: string): string {
  return buildFuzzyIlikeOrFilter(columns, query);
}

function tagsIncludeQuery(tags: string[] | null | undefined, query: string): boolean {
  if (!tags?.length) {
    return false;
  }

  const normalizedQuery = query.toLowerCase();

  return tags.some((tag) => fuzzyMatchesText(tag, query));
}

function relatedProjectLabel(
  project: DocumentRow["projects"] | NomenclatureRow["projects"]
): string | null {
  if (!project) {
    return null;
  }

  const record = Array.isArray(project) ? project[0] : project;
  if (!record) {
    return null;
  }

  return `${formatProjectCodeDisplay(record.code)} · ${record.name}`;
}

function excerpt(content: string, query: string, maxLength = 80): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return content.slice(0, maxLength).trim();
  }

  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + query.length + 40);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";

  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

async function searchProjects(
  supabase: SupabaseClient,
  query: string,
  limit: number
): Promise<Pick<GlobalSearchResults, "projects" | "projectCodes">> {
  const hasLocation = await projectsHaveLocationColumn(supabase);
  const searchColumns = hasLocation
    ? (["name", "code", "location"] as const)
    : (["name", "code"] as const);
  const selectColumns = hasLocation ? "id, name, code, location" : "id, name, code";

  const { data, error } = await supabase
    .from("projects")
    .select(selectColumns)
    .or(
      buildFuzzyIlikeOrFilter([...searchColumns], query, {
        expandVariants: true,
      })
    )
    .order("name")
    .limit(limit * 2);

  if (error || !data) {
    return { projects: [], projectCodes: [] };
  }

  const rows = data as unknown as ProjectRow[];

  const projects: GlobalSearchResult[] = [];
  const projectCodes: GlobalSearchResult[] = [];
  const seenProjects = new Set<string>();
  const seenCodes = new Set<string>();

  for (const row of rows) {
    const nameMatch = fuzzyMatchesText(row.name, query);
    const codeMatch = fuzzyMatchesProjectCode(row.code, query);
    const locationMatch = row.location
      ? fuzzyMatchesText(row.location, query)
      : false;

    if (
      (nameMatch || locationMatch) &&
      !seenProjects.has(row.id) &&
      projects.length < limit
    ) {
      seenProjects.add(row.id);
      projects.push({
        id: row.id,
        type: "project",
        title: formatProjectCodeDisplay(row.code),
        subtitle: [row.name, row.location].filter(Boolean).join(" · "),
        href: projectHref(row.id),
      });
    }

    if (codeMatch && !seenCodes.has(row.id) && projectCodes.length < limit) {
      seenCodes.add(row.id);
      projectCodes.push({
        id: `${row.id}-code`,
        type: "project_code",
        title: formatProjectCodeDisplay(row.code),
        subtitle: [row.name, row.location].filter(Boolean).join(" · "),
        href: projectHref(row.id),
      });
    }
  }

  return { projects, projectCodes };
}

async function searchContacts(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  tagScanLimit: number
): Promise<GlobalSearchResult[]> {
  const [textMatches, tagCandidates] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, company, tags")
      .or(ilikeOrFilter(["name", "email", "phone", "company"], query))
      .order("name")
      .limit(limit),
    supabase
      .from("contacts")
      .select("id, name, email, company, tags")
      .not("tags", "eq", "{}")
      .order("name")
      .limit(tagScanLimit),
  ]);

  const rows = new Map<string, ContactRow>();

  for (const row of (textMatches.data ?? []) as ContactRow[]) {
    rows.set(row.id, row);
  }

  for (const row of (tagCandidates.data ?? []) as ContactRow[]) {
    if (tagsIncludeQuery(row.tags, query)) {
      rows.set(row.id, row);
    }
  }

  return [...rows.values()]
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      type: "contact" as const,
      title: row.name,
      subtitle:
        row.company ??
        row.email ??
        (tagsIncludeQuery(row.tags, query) ? `Tag: ${matchingTag(row.tags, query)}` : null),
      href: contactHref(row.id),
    }));
}

async function searchSuppliers(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  tagScanLimit: number
): Promise<GlobalSearchResult[]> {
  const [textMatches, tagCandidates] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, company, contact_name, email, company_types, tags")
      .or(
        ilikeOrFilter(
          ["company", "contact_name", "email", "phone", "website"],
          query
        )
      )
      .order("company")
      .limit(limit),
    supabase
      .from("suppliers")
      .select("id, company, contact_name, email, company_types, tags")
      .not("tags", "eq", "{}")
      .order("company")
      .limit(tagScanLimit),
  ]);

  const rows = new Map<string, SupplierRow>();

  for (const row of (textMatches.data ?? []) as SupplierRow[]) {
    rows.set(row.id, row);
  }

  for (const row of (tagCandidates.data ?? []) as SupplierRow[]) {
    if (tagsIncludeQuery(row.tags, query)) {
      rows.set(row.id, row);
    }
  }

  return [...rows.values()]
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      type: "supplier" as const,
      title: row.company,
      subtitle:
        row.contact_name ??
        (row.company_types?.length ? row.company_types.join(", ") : null) ??
        row.email ??
        (tagsIncludeQuery(row.tags, query) ? `Tag: ${matchingTag(row.tags, query)}` : null),
      href: supplierHref(row.id),
    }));
}

async function searchDocuments(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  tagScanLimit: number
): Promise<GlobalSearchResult[]> {
  const [textMatches, tagCandidates] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name, file_type, project_id, tags, projects(name, code)")
      .or(ilikeOrFilter(["name", "file_type"], query))
      .order("name")
      .limit(limit),
    supabase
      .from("documents")
      .select("id, name, file_type, project_id, tags, projects(name, code)")
      .not("tags", "eq", "{}")
      .order("name")
      .limit(tagScanLimit),
  ]);

  const rows = new Map<string, DocumentRow>();

  for (const row of (textMatches.data ?? []) as DocumentRow[]) {
    rows.set(row.id, row);
  }

  for (const row of (tagCandidates.data ?? []) as DocumentRow[]) {
    if (tagsIncludeQuery(row.tags, query)) {
      rows.set(row.id, row);
    }
  }

  return [...rows.values()]
    .slice(0, limit)
    .map((row) => {
      const projectLabel = relatedProjectLabel(row.projects);
      const tagLabel = tagsIncludeQuery(row.tags, query)
        ? `Tag: ${matchingTag(row.tags, query)}`
        : null;

      return {
        id: row.id,
        type: "document" as const,
        title: row.name,
        subtitle: projectLabel ?? row.file_type ?? tagLabel,
        href: documentHref(row.id, row.project_id),
      };
    });
}

async function searchNomenclatures(
  supabase: SupabaseClient,
  query: string,
  limit: number
): Promise<GlobalSearchResult[]> {
  const pattern = ilikePattern(query);

  const { data, error } = await supabase
    .from("project_nomenclatures")
    .select("id, project_id, content, projects(name, code)")
    .ilike("content", pattern)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as NomenclatureRow[]).map((row) => ({
    id: row.id,
    type: "nomenclature" as const,
    title: relatedProjectLabel(row.projects) ?? "Project nomenclature",
    subtitle: excerpt(row.content, query),
    href: nomenclatureHref(row.project_id),
  }));
}

function matchingTag(tags: string[] | null | undefined, query: string): string {
  const match = tags?.find((tag) => tag.toLowerCase().includes(query.toLowerCase()));
  return match ?? query;
}

async function collectTaggedRows(
  supabase: SupabaseClient,
  tagScanLimit: number
): Promise<{
  contacts: TaggedRow[];
  suppliers: TaggedRow[];
  documents: TaggedRow[];
}> {
  const [contacts, suppliers, documents] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, tags")
      .not("tags", "eq", "{}")
      .limit(tagScanLimit),
    supabase
      .from("suppliers")
      .select("id, tags")
      .not("tags", "eq", "{}")
      .limit(tagScanLimit),
    supabase
      .from("documents")
      .select("id, tags")
      .not("tags", "eq", "{}")
      .limit(tagScanLimit),
  ]);

  return {
    contacts: (contacts.data ?? []) as TaggedRow[],
    suppliers: (suppliers.data ?? []) as TaggedRow[],
    documents: (documents.data ?? []) as TaggedRow[],
  };
}

async function searchTags(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  tagScanLimit: number
): Promise<GlobalSearchResult[]> {
  const taggedRows = await collectTaggedRows(supabase, tagScanLimit);
  const normalizedQuery = query.toLowerCase();
  const tagUsage = new Map<
    string,
    { contacts: number; suppliers: number; documents: number }
  >();

  function registerTags(
    rows: TaggedRow[],
    field: "contacts" | "suppliers" | "documents"
  ) {
    for (const row of rows) {
      for (const tag of row.tags ?? []) {
        const normalizedTag = normalizeDocumentTag(tag);
        if (!normalizedTag.includes(normalizedQuery)) {
          continue;
        }

        const current = tagUsage.get(normalizedTag) ?? {
          contacts: 0,
          suppliers: 0,
          documents: 0,
        };
        current[field] += 1;
        tagUsage.set(normalizedTag, current);
      }
    }
  }

  registerTags(taggedRows.contacts, "contacts");
  registerTags(taggedRows.suppliers, "suppliers");
  registerTags(taggedRows.documents, "documents");

  return [...tagUsage.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, limit)
    .map(([tag, usage]) => {
      const parts = [
        usage.documents > 0 ? `${usage.documents} documents` : null,
        usage.contacts > 0 ? `${usage.contacts} contacts` : null,
        usage.suppliers > 0 ? `${usage.suppliers} suppliers` : null,
      ].filter(Boolean);

      return {
        id: `tag-${tag}`,
        type: "tag" as const,
        title: tag,
        subtitle: parts.length > 0 ? parts.join(" · ") : null,
        href: tagHref(tag),
      };
    });
}

export async function globalSearch(
  supabase: SupabaseClient,
  query: string,
  options: GlobalSearchOptions = {}
): Promise<GlobalSearchResponse> {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    return {
      query: "",
      results: emptyResults(),
      total: 0,
    };
  }

  const limit = options.limit ?? DEFAULT_LIMIT;
  const tagScanLimit = options.tagScanLimit ?? DEFAULT_TAG_SCAN_LIMIT;

  const [
    projectResults,
    contacts,
    suppliers,
    documents,
    nomenclatures,
    tags,
  ] = await Promise.all([
    searchProjects(supabase, normalizedQuery, limit),
    searchContacts(supabase, normalizedQuery, limit, tagScanLimit),
    searchSuppliers(supabase, normalizedQuery, limit, tagScanLimit),
    searchDocuments(supabase, normalizedQuery, limit, tagScanLimit),
    searchNomenclatures(supabase, normalizedQuery, limit),
    searchTags(supabase, normalizedQuery, limit, tagScanLimit),
  ]);

  const results: GlobalSearchResults = {
    projects: projectResults.projects,
    projectCodes: projectResults.projectCodes,
    contacts,
    suppliers,
    documents,
    tags,
    nomenclatures,
  };

  return {
    query: normalizedQuery,
    results,
    total: countResults(results),
  };
}

export function flattenSearchResults(
  results: GlobalSearchResults
): GlobalSearchResult[] {
  return [
    ...results.projects,
    ...results.projectCodes,
    ...results.contacts,
    ...results.suppliers,
    ...results.documents,
    ...results.tags,
    ...results.nomenclatures,
  ];
}
