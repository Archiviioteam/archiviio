import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { SupplierCompanyType } from "@/types/database";

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
    trimmings: "Trimmings",
    metals: "Metals",
    wallpaper: "Wallpaper",
    laminates: "Laminates",
    finishes: "Finishes",
    leather_eco: "Leather & eco",
    supplies: "Supplies",
    marble: "Marble",
    carpets: "Carpets",
    handles: "Handles",
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
    trimmings: "Passamanerie",
    metals: "Metalli",
    wallpaper: "Carte da parati",
    laminates: "Laminati",
    finishes: "Finiture",
    leather_eco: "Pelle e eco",
    supplies: "Forniture",
    marble: "Marmi",
    carpets: "Tappeti",
    handles: "Maniglie",
    other: "Altro",
  },
};

const ALL_SUPPLIER_COMPANY_TYPES = Object.keys(
  SUPPLIER_COMPANY_TYPE_LABELS.en
) as SupplierCompanyType[];

export function getSupplierCompanyTypeOptions(language: AppLanguage = "en") {
  return ALL_SUPPLIER_COMPANY_TYPES.map((value) => ({
    value,
    label: SUPPLIER_COMPANY_TYPE_LABELS[language][value],
  })).sort((a, b) =>
    a.label.localeCompare(b.label, language === "it" ? "it" : "en", {
      sensitivity: "base",
    })
  );
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
