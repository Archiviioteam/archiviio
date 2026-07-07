"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog";
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
import { deleteSupplier } from "@/lib/suppliers/delete-supplier";
import { filterSuppliers } from "@/lib/suppliers/filter-suppliers";
import { fetchWorkspaceSuppliers } from "@/lib/suppliers/fetch-workspace-suppliers";
import { createClient } from "@/lib/supabase/client";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Supplier, SupplierCompanyType } from "@/types/database";

export function SuppliersContent() {
  const language = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SupplierCompanyType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSuppliers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setEditingSupplier(null);
      setDialogOpen(true);
      router.replace("/suppliers");
    }
  }, [router, searchParams]);

  const filteredSuppliers = useMemo(
    () => filterSuppliers(suppliers, { query, companyType: category, language }),
    [suppliers, query, category, language]
  );

  const hasActiveFilters = query.length > 0 || category !== null;

  const handleSupplierSaved = useCallback((supplier: Supplier) => {
    setSuppliers((current) => {
      const exists = current.some((item) => item.id === supplier.id);
      const next = exists
        ? current.map((item) => (item.id === supplier.id ? supplier : item))
        : [...current, supplier];

      return next.sort((a, b) =>
        a.company.localeCompare(b.company, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSupplier(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingSupplier(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  }, []);

  const handleSupplierDeleted = useCallback((supplierId: string) => {
    setSuppliers((current) => current.filter((item) => item.id !== supplierId));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(t(language, "common.workspaceNotFound"));
      setDeleting(false);
      return;
    }

    const result = await deleteSupplier({
      supabase,
      workspaceId,
      supplierId: deleteTarget.id,
      company: deleteTarget.company,
    });

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      t(language, "suppliers.deletedToast").replace(
        "{name}",
        deleteTarget.company
      )
    );
    handleSupplierDeleted(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleSupplierDeleted, language]);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "suppliers.loading")}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          {suppliers.length > 0 ? (
            <>
              <SupplierFilters
                query={query}
                companyType={category}
                onQueryChange={setQuery}
                onCompanyTypeChange={setCategory}
                onAddClick={openCreateDialog}
              />

              {filteredSuppliers.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <EmptyState
                      title={
                        hasActiveFilters
                          ? t(language, "suppliers.emptySearchTitle")
                          : t(language, "suppliers.emptyTitle")
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
                      onClick={openEditDialog}
                      onDelete={setDeleteTarget}
                      deleteDisabled={deleting}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Truck}
                  action={{
                    label: t(language, "suppliers.addTitle"),
                    onClick: openCreateDialog,
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <AddSupplierDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        supplier={editingSupplier}
        onSupplierSaved={handleSupplierSaved}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(language, "suppliers.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "suppliers.deleteDescription").replace(
                "{name}",
                deleteTarget?.company ?? ""
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting
                ? t(language, "common.deleting")
                : t(language, "common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
