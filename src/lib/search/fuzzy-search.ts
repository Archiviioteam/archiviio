const PROJECT_CODE_PREFIX = "rif#";

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&").replace(/"/g, '""');
}

export function ilikePattern(query: string): string {
  return `%${escapeIlikePattern(query)}%`;
}

export function expandQueryVariants(query: string): string[] {
  const trimmed = query.trim();
  const variants = new Set<string>();

  if (!trimmed) {
    return [];
  }

  variants.add(trimmed);

  const lower = trimmed.toLowerCase();
  const withoutPrefix = trimmed.replace(/^rif#?/i, "");

  if (withoutPrefix && withoutPrefix !== trimmed) {
    variants.add(withoutPrefix);
    variants.add(`${PROJECT_CODE_PREFIX}${withoutPrefix}`);
    if (/^\d+$/.test(withoutPrefix)) {
      variants.add(`${PROJECT_CODE_PREFIX}${withoutPrefix.padStart(4, "0")}`);
    }
  }

  if (/^\d+$/.test(trimmed)) {
    variants.add(`${PROJECT_CODE_PREFIX}${trimmed}`);
    variants.add(`${PROJECT_CODE_PREFIX}${trimmed.padStart(4, "0")}`);
  }

  if (lower.startsWith("rif") && !lower.startsWith("rif#") && /^\d+$/.test(withoutPrefix)) {
    variants.add(`${PROJECT_CODE_PREFIX}${withoutPrefix}`);
  }

  return [...variants];
}

export function buildFuzzyIlikeOrFilter(
  columns: string[],
  query: string,
  options: { expandVariants?: boolean } = {}
): string {
  const terms = options.expandVariants
    ? expandQueryVariants(query)
    : [query];

  const filters = new Set<string>();

  for (const column of columns) {
    for (const term of terms) {
      filters.add(`${column}.ilike."${ilikePattern(term)}"`);
    }
  }

  return [...filters].join(",");
}

export function normalizeProjectCodeDigits(code: string): string {
  return code.toLowerCase().replace(/^rif#/, "").replace(/\D/g, "");
}

export function normalizeQueryDigits(query: string): string {
  return query.toLowerCase().replace(/^rif#?/, "").replace(/\D/g, "");
}

export function stripLeadingZeros(value: string): string {
  const stripped = value.replace(/^0+/, "");
  return stripped.length > 0 ? stripped : "0";
}

export function fuzzyMatchesText(
  value: string | null | undefined,
  query: string
): boolean {
  if (!value || !query) {
    return false;
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerValue.includes(lowerQuery)) {
    return true;
  }

  for (const variant of expandQueryVariants(query)) {
    if (lowerValue.includes(variant.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export function fuzzyMatchesProjectCode(code: string, query: string): boolean {
  if (fuzzyMatchesText(code, query)) {
    return true;
  }

  const codeDigits = normalizeProjectCodeDigits(code);
  const queryDigits = normalizeQueryDigits(query);

  if (!codeDigits || !queryDigits) {
    return false;
  }

  if (codeDigits.includes(queryDigits)) {
    return true;
  }

  return stripLeadingZeros(codeDigits).includes(stripLeadingZeros(queryDigits));
}

export function fuzzyMatchesSubsequence(value: string, query: string): boolean {
  if (!value || !query) {
    return false;
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = 0;

  for (const char of lowerQuery) {
    index = lowerValue.indexOf(char, index);
    if (index === -1) {
      return false;
    }
    index += 1;
  }

  return true;
}
