export const NAV_ORDER_STORAGE_KEY = "archiviio:nav-order";

const DEPRECATED_NAV_HREFS = new Set(["/mail"]);

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

    return parsed.filter((href) => !DEPRECATED_NAV_HREFS.has(href));
  } catch {
    return null;
  }
}

export function writeNavOrder(order: string[]): void {
  const cleaned = order.filter((href) => !DEPRECATED_NAV_HREFS.has(href));
  window.localStorage.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(cleaned));
}

/** Remove deprecated routes (e.g. /mail) from saved sidebar order. */
export function purgeDeprecatedNavHrefs(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(NAV_ORDER_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((href) => typeof href === "string")) {
      window.localStorage.removeItem(NAV_ORDER_STORAGE_KEY);
      return;
    }

    const cleaned = parsed.filter((href) => !DEPRECATED_NAV_HREFS.has(href));
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch {
    window.localStorage.removeItem(NAV_ORDER_STORAGE_KEY);
  }
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
