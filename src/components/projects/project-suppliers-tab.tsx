"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { AddProjectSupplierDialog } from "@/components/projects/add-project-supplier-dialog";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { SupplierFilters } from "@/components/suppliers/supplier-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { exportProjectSuppliersPdf } from "@/lib/suppliers/export-project-suppliers-pdf";
import { filterSuppliers } from "@/lib/suppliers/filter-suppliers";
import { fetchProjectSuppliers } from "@/lib/suppliers/fetch-project-suppliers";
import { unlinkSupplierFromProject } from "@/lib/suppliers/unlink-supplier-from-project";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Supplier, SupplierCompanyType } from "@/types/database";

interface ProjectSuppliersTabProps {
  projectId: string;
  projectName: string;
  projectLocation: string | null;
  projectCode: string;
}

export function ProjectSuppliersTab({
  projectId,
  projectName,
  projectLocation,
  projectCode,
}: ProjectSuppliersTabProps) {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SupplierCompanyType | null>(null);
  const [inMaterialLibrary, setInMaterialLibrary] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<Supplier | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const loadSuppliers = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    const data = await fetchProjectSuppliers(supabase, workspaceId, projectId);
    setSuppliers(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const linkedSupplierIds = useMemo(
    () => new Set(suppliers.map((supplier) => supplier.id)),
    [suppliers]
  );

  const filteredSuppliers = useMemo(
    () => filterSuppliers(suppliers, { query, companyType: category, inMaterialLibrary, language }),
    [suppliers, query, category, inMaterialLibrary, language]
  );

  const hasActiveFilters =
    query.length > 0 || category !== null || inMaterialLibrary !== null;

  const handleExportPdf = useCallback(() => {
    if (suppliers.length === 0) {
      toast.error(
        language === "it"
          ? "Nessun fornitore da esportare"
          : "No suppliers to export"
      );
      return;
    }

    exportProjectSuppliersPdf({
      projectName,
      projectLocation,
      projectCode,
      suppliers,
    });

    toast.success(
      language === "it"
        ? "PDF fornitori esportato"
        : "Suppliers PDF exported"
    );
  }, [language, projectCode, projectLocation, projectName, suppliers]);

  const handleSupplierLinked = useCallback((supplier: Supplier) => {
    setSuppliers((current) => {
      const next = [...current, supplier];
      return next.sort((a, b) =>
        a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  const handleUnlink = useCallback(async () => {
    if (!unlinkTarget) {
      return;
    }

    setUnlinking(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setUnlinking(false);
      return;
    }

    const result = await unlinkSupplierFromProject({
      supabase,
      workspaceId,
      projectId,
      supplierId: unlinkTarget.id,
      supplierName: unlinkTarget.company,
    });

    setUnlinking(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      language === "it"
        ? `${unlinkTarget.company} rimosso dal progetto`
        : `${unlinkTarget.company} removed from project`
    );
    setSuppliers((current) =>
      current.filter((supplier) => supplier.id !== unlinkTarget.id)
    );
    setUnlinkTarget(null);
  }, [language, projectId, unlinkTarget]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {language === "it" ? "Caricamento fornitori..." : "Loading suppliers..."}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={suppliers.length === 0}
          >
            <Download className="size-4" aria-hidden />
            {language === "it" ? "Esporta PDF" : "Export PDF"}
          </Button>
        </div>
        {suppliers.length > 0 ? (
          <>
            <SupplierFilters
              query={query}
              companyType={category}
              inMaterialLibrary={inMaterialLibrary}
              onQueryChange={setQuery}
              onCompanyTypeChange={setCategory}
              onMaterialLibraryChange={setInMaterialLibrary}
              onAddClick={() => setDialogOpen(true)}
            />

            {filteredSuppliers.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <EmptyState
                    title={
                      language === "it"
                        ? hasActiveFilters
                          ? "Nessun fornitore corrisponde alla ricerca"
                          : "Nessun fornitore collegato"
                        : hasActiveFilters
                          ? "No suppliers match your search"
                          : "No suppliers linked yet"
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onDelete={setUnlinkTarget}
                    deleteDisabled={unlinking}
                    removeMode="unlink"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                title={
                  language === "it"
                    ? "Nessun fornitore collegato"
                    : "No suppliers linked yet"
                }
                action={{
                  label: language === "it" ? "Aggiungi fornitore" : "Add supplier",
                  onClick: () => setDialogOpen(true),
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <AddProjectSupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        linkedSupplierIds={linkedSupplierIds}
        onSupplierLinked={handleSupplierLinked}
      />

      <Dialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnlinkTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "it" ? "Rimuovi dal progetto" : "Remove from project"}
            </DialogTitle>
            <DialogDescription>
              {language === "it"
                ? `${unlinkTarget?.company} verra rimosso da questo progetto. Il fornitore non verra eliminato dalla tua lista fornitori.`
                : `${unlinkTarget?.company} will be removed from this project. The supplier will not be deleted from your suppliers list.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUnlinkTarget(null)}
              disabled={unlinking}
            >
              {language === "it" ? "Annulla" : "Cancel"}
            </Button>
            <Button onClick={() => void handleUnlink()} disabled={unlinking}>
              {unlinking
                ? language === "it"
                  ? "Rimozione..."
                  : "Removing..."
                : language === "it"
                  ? "Rimuovi dal progetto"
                  : "Remove from project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
