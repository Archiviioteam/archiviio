import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { ContactType } from "@/types/database";

const CONTACT_TYPE_ORDER: ContactType[] = [
  "architetto",
  "collaboratore",
  "impresa",
  "elettricista",
  "ingegnere",
  "idraulico",
  "geometra",
  "tecnico",
  "altro",
];

const CONTACT_TYPE_LABELS: Record<AppLanguage, Record<ContactType, string>> = {
  en: {
    architetto: "Architect",
    collaboratore: "Collaborator",
    impresa: "Contractor",
    elettricista: "Electrician",
    ingegnere: "Engineer",
    idraulico: "Plumber",
    geometra: "Surveyor",
    tecnico: "Technician",
    altro: "Other",
  },
  it: {
    architetto: "Architetto",
    collaboratore: "Collaboratore",
    impresa: "Impresa",
    elettricista: "Elettricista",
    ingegnere: "Ingegnere",
    idraulico: "Idraulico",
    geometra: "Geometra",
    tecnico: "Tecnico",
    altro: "Altro",
  },
};

export function getContactTypeOptions(language: AppLanguage = "en") {
  return CONTACT_TYPE_ORDER.map((value) => ({
    value,
    label: CONTACT_TYPE_LABELS[language][value],
  }));
}

/** @deprecated Use `getContactTypeOptions(language)` instead. */
export const CONTACT_TYPE_OPTIONS = getContactTypeOptions("en");

export function getContactTypeLabel(
  type: ContactType | null,
  language: AppLanguage = "en"
): string | null {
  if (!type) {
    return null;
  }

  return CONTACT_TYPE_LABELS[language][type] ?? type;
}
