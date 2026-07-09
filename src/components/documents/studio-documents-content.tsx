"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DocumentFileTypeFilter } from "@/lib/documents/document-file-types";
import { filterDocuments } from "@/lib/documents/document-tags";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Document } from "@/types/database";

const UPLOADER_INPUT_ID = "studio-documents-uploader";

export function StudioDocumentsContent() {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFileTypes, setSelectedFileTypes] = useState<
    DocumentFileTypeFilter[]
  >([]);

  const loadDocuments = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("project_id", null)
      .order("created_at", { ascending: false });

    setDocuments(
      ((data as Document[]) ?? []).map((document) => ({
        ...document,
        tags: document.tags ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(
    () =>
      filterDocuments(documents, {
        search,
        fileTypes: selectedFileTypes,
      }),
    [documents, search, selectedFileTypes]
  );

  const handleUploadComplete = useCallback((document: Document) => {
    setDocuments((current) => [
      { ...document, tags: document.tags ?? [] },
      ...current,
    ]);
  }, []);

  const handleDocumentDeleted = useCallback((documentId: string) => {
    setDocuments((current) =>
      current.filter((document) => document.id !== documentId)
    );
  }, []);

  const handleFileTypeToggle = useCallback((fileType: DocumentFileTypeFilter) => {
    setSelectedFileTypes((current) =>
      current.includes(fileType)
        ? current.filter((currentType) => currentType !== fileType)
        : [...current, fileType]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedFileTypes([]);
  }, []);

  const handleAddClick = useCallback(() => {
    document.getElementById(UPLOADER_INPUT_ID)?.click();
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className="text-sm text-muted-foreground">
            {t(language, "documents.loading")}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  const hasActiveFilters = search.length > 0 || selectedFileTypes.length > 0;

  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          <DocumentFilters
            search={search}
            selectedFileTypes={selectedFileTypes}
            onSearchChange={setSearch}
            onFileTypeToggle={handleFileTypeToggle}
            onAddClick={handleAddClick}
            onClearFilters={handleClearFilters}
          />

          <DocumentUploader
            inputId={UPLOADER_INPUT_ID}
            showDropzone={documents.length === 0}
            onUploadComplete={handleUploadComplete}
          />

          {documents.length === 0 ? null : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={emptyStatePresets.documentsSearch.icon}
                  title={
                    hasActiveFilters
                      ? t(language, "documents.emptySearchTitle")
                      : t(language, "documents.emptyTitle")
                  }
                  action={
                    hasActiveFilters
                      ? {
                          label: emptyStatePresets.documentsSearch.actionLabel,
                          onClick: handleClearFilters,
                        }
                      : {
                          label: t(language, "documents.uploadTitle"),
                          onClick: handleAddClick,
                        }
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <DocumentList
              documents={filteredDocuments}
              variant="studio"
              onDocumentDeleted={handleDocumentDeleted}
            />
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
