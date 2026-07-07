import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { SupplierCompanyType } from "@/types/database";

const SUPPLIER_COMPANY_TYPE_ORDER: SupplierCompanyType[] = [
  "lighting",
  "gres",
  "wood",
  "bathroom",
  "flooring",
  "furniture",
  "kitchens",
  "outdoor",
  "curtains",
  "upholstery",
  "other",
];

const SUPPLIER_COMPANY_TYPE_LABELS: Record<
  AppLanguage,
  Record<SupplierCompanyType, string>
> = {
  en: {
    lighting: "Lighting",
    gres: "Gres",
    wood: "Wood",
    bathroom: "Bathroom",
    flooring: "Flooring",
    furniture: "Furniture",
    kitchens: "Kitchens",
    outdoor: "Outdoor",
    curtains: "Curtains",
    upholstery: "Upholstery",
    other: "Other",
  },
  it: {
    lighting: "Illuminazione",
    gres: "Gres",
    wood: "Legno",
    bathroom: "Bagno",
    flooring: "Pavimenti",
    furniture: "Arredamento",
    kitchens: "Cucine",
    outdoor: "Esterno",
    curtains: "Tende",
    upholstery: "Tessuti",
    other: "Altro",
  },
};

export function getSupplierCompanyTypeOptions(language: AppLanguage = "en") {
  return SUPPLIER_COMPANY_TYPE_ORDER.map((value) => ({
    value,
    label: SUPPLIER_COMPANY_TYPE_LABELS[language][value],
  }));
}

/** @deprecated Use `getSupplierCompanyTypeOptions(language)` instead. */
export const SUPPLIER_COMPANY_TYPE_OPTIONS = getSupplierCompanyTypeOptions("en");

export function getSupplierCompanyTypeLabel(
  type: SupplierCompanyType | string,
  language: AppLanguage = "en"
): string {
  return SUPPLIER_COMPANY_TYPE_LABELS[language][type as SupplierCompanyType] ?? type;
}

export function formatSupplierCompanyTypes(
  types: SupplierCompanyType[] | string[] | null | undefined,
  language: AppLanguage = "en"
): string {
  if (!types?.length) {
    return "—";
  }

  return types
    .map((type) => getSupplierCompanyTypeLabel(type, language))
    .join(", ");
}
