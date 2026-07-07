import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { getContactTypeLabel } from "@/lib/contacts/contact-types";
import type { Contact } from "@/types/database";

export interface ContactSearchFilters {
  query: string;
  language?: AppLanguage;
}

function matchesQuery(
  contact: Contact,
  query: string,
  language: AppLanguage = "en"
): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const nameMatch = contact.name.toLowerCase().includes(normalizedQuery);
  const companyMatch =
    contact.company?.toLowerCase().includes(normalizedQuery) ?? false;
  const typeLabel = getContactTypeLabel(contact.type, language);
  const typeMatch =
    (contact.type?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (typeLabel?.toLowerCase().includes(normalizedQuery) ?? false);

  return nameMatch || companyMatch || typeMatch;
}

export function filterContacts(
  contacts: Contact[],
  filters: ContactSearchFilters
): Contact[] {
  return contacts.filter((contact) =>
    matchesQuery(contact, filters.query, filters.language)
  );
}
