"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DocumentFileTypeFilter } from "@/lib/documents/document-file-types";
import { filterDocuments } from "@/lib/documents/document-tags";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Document } from "@/types/database";

const UPLOADER_INPUT_ID = "project-document-uploader";

interface ProjectDocumentsTabProps {
  projectId: string;
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
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
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    setDocuments(
      ((data as Document[]) ?? []).map((document) => ({
        ...document,
        tags: document.tags ?? [],
      }))
    );
    setLoading(false);
  }, [projectId]);

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
      <p className="text-sm text-muted-foreground">
        {language === "it" ? "Caricamento elaborati..." : "Loading deliverables..."}
      </p>
    );
  }

  const hasActiveFilters = search.length > 0 || selectedFileTypes.length > 0;

  return (
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
        projectId={projectId}
        inputId={UPLOADER_INPUT_ID}
        showDropzone={documents.length === 0}
        onUploadComplete={handleUploadComplete}
      />

      {documents.length === 0 ? null : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={emptyStatePresets.elaboratiSearch.icon}
              title={
                hasActiveFilters
                  ? emptyStatePresets.elaboratiSearch.title
                  : emptyStatePresets.elaborati.title
              }
              action={
                hasActiveFilters
                  ? {
                      label: emptyStatePresets.elaboratiSearch.actionLabel,
                      onClick: handleClearFilters,
                    }
                  : {
                      label: language === "it" ? "Aggiungi file" : "Add file",
                      onClick: handleAddClick,
                    }
              }
            />
          </CardContent>
        </Card>
      ) : (
        <DocumentList
          documents={filteredDocuments}
          onDocumentDeleted={handleDocumentDeleted}
        />
      )}
    </div>
  );
}
