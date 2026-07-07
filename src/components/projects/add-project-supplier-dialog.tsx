"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { filterSuppliers } from "@/lib/suppliers/filter-suppliers";
import { fetchWorkspaceSuppliers } from "@/lib/suppliers/fetch-workspace-suppliers";
import { linkSupplierToProject } from "@/lib/suppliers/link-supplier-to-project";
import {
  getSupplierCompanyTypeLabel,
  getSupplierCompanyTypeOptions,
} from "@/lib/suppliers/supplier-types";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { useAppLanguage } from "@/lib/settings/language";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Supplier, SupplierCompanyType } from "@/types/database";

const selectClassName = cn(
  "flex h-12 min-w-[10rem] cursor-pointer appearance-none border border-input bg-card px-3 py-2 pr-10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

interface AddProjectSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  linkedSupplierIds: Set<string>;
  onSupplierLinked: (supplier: Supplier) => void;
}

function supplierSubtitle(supplier: Supplier, language: AppLanguage): string {
  const typeLabels = supplier.company_types
    .map((type) => getSupplierCompanyTypeLabel(type, language))
    .join(", ");
  const parts = [typeLabels, supplier.contact_name, supplier.email].filter(
    (value) => value?.trim()
  );

  return parts.join(" · ") || (language === "it" ? "Nessun dettaglio" : "No details");
}

export function AddProjectSupplierDialog({
  open,
  onOpenChange,
  projectId,
  linkedSupplierIds,
  onSupplierLinked,
}: AddProjectSupplierDialogProps) {
  const language = useAppLanguage();
  const companyTypeOptions = getSupplierCompanyTypeOptions(language);
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [companyType, setCompanyType] = useState<SupplierCompanyType | null>(
    null
  );
  const [linkingSupplierId, setLinkingSupplierId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCompanyType(null);
      setLinkingSupplierId(null);
      return;
    }

    async function loadSuppliers() {
      setLoading(true);
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setSuppliers([]);
        setLoading(false);
        return;
      }

      const data = await fetchWorkspaceSuppliers(supabase, workspaceId);
      setSuppliers(data);
      setLoading(false);
    }

    void loadSuppliers();
  }, [open]);

  const availableSuppliers = useMemo(
    () => suppliers.filter((supplier) => !linkedSupplierIds.has(supplier.id)),
    [suppliers, linkedSupplierIds]
  );

  const filteredSuppliers = useMemo(
    () =>
      filterSuppliers(availableSuppliers, {
        query,
        companyType,
        language,
      }),
    [availableSuppliers, query, companyType, language]
  );

  async function handleSelect(supplier: Supplier) {
    setLinkingSupplierId(supplier.id);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setLinkingSupplierId(null);
      return;
    }

    const result = await linkSupplierToProject({
      supabase,
      workspaceId,
      projectId,
      supplierId: supplier.id,
      supplierName: supplier.company,
    });

    setLinkingSupplierId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      language === "it"
        ? `${supplier.company} aggiunto al progetto`
        : `${supplier.company} added to project`
    );
    onSupplierLinked(result.supplier);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === "it" ? "Aggiungi fornitore" : "Add supplier"}
          </DialogTitle>
          <DialogDescription>
            {language === "it"
              ? "Scegli un fornitore salvato da collegare a questo progetto."
              : "Choose a saved supplier to link to this project."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {language === "it" ? "Caricamento fornitori..." : "Loading suppliers..."}
          </p>
        ) : suppliers.length === 0 ? (
          <EmptyState
            compact
            title={language === "it" ? "Nessun fornitore" : "No suppliers yet"}
            action={{
              label: language === "it" ? "Crea fornitore" : "Create supplier",
              onClick: () => {
                onOpenChange(false);
                router.push("/suppliers?action=create");
              },
            }}
          />
        ) : availableSuppliers.length === 0 ? (
          <EmptyState
            compact
            title={
              language === "it"
                ? "Tutti i fornitori sono gia collegati"
                : "All suppliers are already linked"
            }
            action={{
              label: language === "it" ? "Vai ai fornitori" : "Go to suppliers",
              onClick: () => {
                onOpenChange(false);
                router.push("/suppliers");
              },
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-row flex-wrap items-center gap-3">
              <SearchInput
                placeholder={
                  language === "it"
                    ? "Cerca per azienda, contatto o email..."
                    : "Search by company, contact, or email..."
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1"
              />

              <div className="relative shrink-0">
                <select
                  value={companyType ?? ""}
                  onChange={(event) =>
                    setCompanyType(
                      (event.target.value as SupplierCompanyType) || null
                    )
                  }
                  className={selectClassName}
                  aria-label={language === "it" ? "Filtra per categoria" : "Filter by category"}
                >
                  <option value="">
                    {language === "it" ? "Tutte le categorie" : "All categories"}
                  </option>
                  {companyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {filteredSuppliers.length === 0 ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it"
                  ? "Nessun fornitore corrisponde alla ricerca."
                  : "No suppliers match your search."}
              </p>
            ) : (
              <div className="flex max-h-list flex-col gap-1 overflow-y-auto">
                {filteredSuppliers.map((supplier) => (
                  <Button
                    key={supplier.id}
                    variant="outline"
                    className="h-auto flex-col items-start gap-0.5 px-3 py-2"
                    disabled={linkingSupplierId !== null}
                    onClick={() => void handleSelect(supplier)}
                  >
                    <span
                      className={cn(textStyle.bodyMedium, "text-foreground")}
                    >
                      {supplier.company}
                    </span>
                    <span
                      className={cn(textStyle.caption, "text-muted-foreground")}
                    >
                      {supplierSubtitle(supplier, language)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
