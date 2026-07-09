"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddNoteDialog } from "@/components/notes/add-note-dialog";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
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
import { deleteNote } from "@/lib/notes/delete-note";
import { fetchWorkspaceNotes } from "@/lib/notes/fetch-notes";
import { createClient } from "@/lib/supabase/client";
import { formatClientError } from "@/lib/supabase/format-error";
import { getWorkspaceId } from "@/lib/workspace";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date-format";
import type { WorkspaceNote } from "@/types/database";

function formatNoteDate(value: string): string {
  return formatDateTime(value);
}

export function NotesContent() {
  const language = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WorkspaceNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setNotes([]);
        setLoadError(language === "it" ? "Workspace non trovato" : "Workspace not found");
        setLoading(false);
        return;
      }

      const result = await fetchWorkspaceNotes(supabase, workspaceId);
      setNotes(result.notes);

      if (!result.ok) {
        setLoadError(result.error);
        if (!result.error.includes("Retrying")) {
          toast.error(result.error);
        }
      }
    } catch (error) {
      const message = formatClientError(
        error,
        language === "it" ? "Caricamento note non riuscito" : "Failed to load notes"
      );
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const openCreateDialog = useCallback(() => {
    setEditingNote(null);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      openCreateDialog();
      router.replace("/notes");
    }
  }, [openCreateDialog, router, searchParams]);

  const openEditDialog = useCallback((note: WorkspaceNote) => {
    setEditingNote(note);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  }, []);

  const handleNoteSaved = useCallback((note: WorkspaceNote) => {
    setNotes((current) => {
      const exists = current.some((item) => item.id === note.id);
      const next = exists
        ? current.map((item) => (item.id === note.id ? note : item))
        : [note, ...current];

      return next.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setDeleting(false);
      return;
    }

    const result = await deleteNote({
      supabase,
      workspaceId,
      noteId: deleteTarget.id,
    });

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(t(language, "notes.deletedToast").replace("{title}", deleteTarget.title));
    setNotes((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget, language]);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "notes.loading")}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          {notes.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button type="button" onClick={openCreateDialog}>
                  <Plus />
                  {t(language, "notes.add")}
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className="cursor-pointer transition-colors hover:bg-muted/20"
                    onClick={() => openEditDialog(note)}
                  >
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className={cn(textStyle.bodyMedium, "text-foreground")}>
                            {note.title}
                          </p>
                          <span
                            className={cn(
                              textStyle.caption,
                              "shrink-0 text-muted-foreground"
                            )}
                          >
                            {formatNoteDate(note.updated_at)}
                          </span>
                        </div>
                        {note.content ? (
                          <p
                            className={cn(
                              textStyle.body,
                              "mt-2 whitespace-pre-wrap text-muted-foreground"
                            )}
                          >
                            {note.content}
                          </p>
                        ) : (
                          <p
                            className={cn(
                              textStyle.body,
                              "mt-2 text-muted-foreground/70"
                            )}
                          >
                            {t(language, "notes.noContent")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={deleting}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(note);
                        }}
                        aria-label={`${t(language, "notes.delete")} ${note.title}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : loadError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <p className={cn(textStyle.body, "text-destructive")}>
                  {loadError}
                </p>
                <Button type="button" variant="outline" onClick={() => void loadNotes()}>
                  {t(language, "notes.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title={t(language, "notes.emptyTitle")}
              action={{
                label: t(language, "notes.add"),
                onClick: openCreateDialog,
              }}
            />
          )}
        </div>
      </PageContent>

      <AddNoteDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        note={editingNote}
        onNoteSaved={handleNoteSaved}
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
            <DialogTitle>{t(language, "notes.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "notes.deleteDescription").replace(
                "{title}",
                deleteTarget?.title ?? ""
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t(language, "notes.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? t(language, "notes.deleting") : t(language, "notes.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
