export const NAV_ORDER_STORAGE_KEY = "archiviio:nav-order";

export function readNavOrder(): string[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(NAV_ORDER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((href) => typeof href === "string")) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeNavOrder(order: string[]): void {
  window.localStorage.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function mergeNavOrder(
  savedOrder: string[] | null,
  defaultHrefs: string[]
): string[] {
  if (!savedOrder) {
    return defaultHrefs;
  }

  const known = new Set(defaultHrefs);
  const ordered = savedOrder.filter((href) => known.has(href));
  const missing = defaultHrefs.filter((href) => !ordered.includes(href));

  return [...ordered, ...missing];
}

export function sortNavItemsByOrder<T extends { href: string }>(
  items: T[],
  order: string[]
): T[] {
  const byHref = new Map(items.map((item) => [item.href, item]));

  return order
    .map((href) => byHref.get(href))
    .filter((item): item is T => item !== undefined);
}
