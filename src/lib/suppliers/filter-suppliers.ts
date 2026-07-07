import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { Supplier, SupplierCompanyType } from "@/types/database";
import { getSupplierCompanyTypeLabel } from "@/lib/suppliers/supplier-types";

export interface SupplierSearchFilters {
  query: string;
  companyType: SupplierCompanyType | null;
  language?: AppLanguage;
}

function matchesQuery(
  supplier: Supplier,
  query: string,
  language: AppLanguage = "en"
): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const companyMatch = supplier.company.toLowerCase().includes(normalizedQuery);
  const contactMatch =
    supplier.contact_name?.toLowerCase().includes(normalizedQuery) ?? false;
  const emailMatch =
    supplier.email?.toLowerCase().includes(normalizedQuery) ?? false;
  const websiteMatch =
    supplier.website?.toLowerCase().includes(normalizedQuery) ?? false;
  const typeMatch = supplier.company_types.some((type) => {
    const label = getSupplierCompanyTypeLabel(type, language).toLowerCase();
    return type.toLowerCase().includes(normalizedQuery) || label.includes(normalizedQuery);
  });

  return companyMatch || contactMatch || emailMatch || websiteMatch || typeMatch;
}

function matchesCompanyType(
  supplier: Supplier,
  companyType: SupplierCompanyType | null
): boolean {
  if (!companyType) {
    return true;
  }

  return supplier.company_types.includes(companyType);
}

export function filterSuppliers(
  suppliers: Supplier[],
  filters: SupplierSearchFilters
): Supplier[] {
  return suppliers.filter(
    (supplier) =>
      matchesQuery(supplier, filters.query, filters.language) &&
      matchesCompanyType(supplier, filters.companyType)
  );
}
