"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteDocument,
  downloadDocument,
  getDocumentSignedUrl,
} from "@/lib/documents/document-actions";
import { openDocumentWithSystem } from "@/lib/documents/open-document-system";
import { isDownloadOnlyDocument } from "@/lib/documents/document-utils";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { isTauri } from "@/lib/tauri/env";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";

interface DocumentListProps {
  documents: Document[];
  onDocumentDeleted: (documentId: string) => void;
}

export function DocumentList({
  documents,
  onDocumentDeleted,
}: DocumentListProps) {
  const language = useAppLanguage();
  const [preview, setPreview] = useState<{
    document: Document;
    url: string | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "preview" | "download" | "delete" | null
  >(null);

  const setBusy = (
    documentId: string | null,
    action: "preview" | "download" | "delete" | null
  ) => {
    setBusyDocumentId(documentId);
    setBusyAction(action);
  };

  const handlePreview = async (document: Document) => {
    setBusy(document.id, "preview");

    const supabase = createClient();
    const result = await getDocumentSignedUrl(supabase, document.file_url);

    if (!result.ok) {
      setBusy(null, null);
      toast.error(result.error);
      return;
    }

    if (isTauri()) {
      const systemOpen = await openDocumentWithSystem(result.url, document.name);
      setBusy(null, null);

      if (systemOpen.ok) {
        return;
      }

      toast.error(systemOpen.error);
      return;
    }

    setBusy(null, null);

    if (isDownloadOnlyDocument(document.file_type)) {
      return;
    }

    setPreview({ document, url: result.url });
  };

  const handleDownload = async (document: Document) => {
    setBusy(document.id, "download");

    const supabase = createClient();
    const result = await downloadDocument(supabase, document);

    setBusy(null, null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${document.name} downloaded`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setBusy(deleteTarget.id, "delete");

    const supabase = createClient();
    const result = await deleteDocument(supabase, deleteTarget);

    setBusy(null, null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (preview?.document.id === deleteTarget.id) {
      setPreview(null);
    }

    toast.success(
      t(language, "elaborati.deletedToast").replace("{name}", deleteTarget.name)
    );
    onDocumentDeleted(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((document) => {
          const isBusy = busyDocumentId === document.id;
          const canOpenOnClick =
            isTauri() || !isDownloadOnlyDocument(document.file_type);

          return (
            <DocumentCard
              key={document.id}
              document={document}
              disabled={isBusy}
              onPreview={
                canOpenOnClick
                  ? () => void handlePreview(document)
                  : undefined
              }
              onDownload={() => void handleDownload(document)}
              onDelete={() => setDeleteTarget(document)}
            />
          );
        })}
      </div>

      <DocumentPreviewDialog
        document={preview?.document ?? null}
        url={preview?.url ?? null}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null);
          }
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(language, "elaborati.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "elaborati.deleteDescription").replace(
                "{name}",
                deleteTarget?.name ?? ""
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={busyAction === "delete"}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={busyAction === "delete"}
            >
              {busyAction === "delete"
                ? t(language, "common.deleting")
                : t(language, "common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
