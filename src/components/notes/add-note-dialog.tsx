"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createNote } from "@/lib/notes/create-note";
import { updateNote } from "@/lib/notes/update-note";
import { createClient } from "@/lib/supabase/client";
import { formatClientError } from "@/lib/supabase/format-error";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceNote } from "@/types/database";

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: WorkspaceNote | null;
  onNoteSaved: (note: WorkspaceNote) => void;
  initialContent?: string;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  note = null,
  onNoteSaved,
  initialContent = "",
}: AddNoteDialogProps) {
  const language = useAppLanguage();
  const isEditing = note !== null;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (note) {
      setTitle(note.title);
      setContent(note.content);
      return;
    }

    setTitle("");
    setContent(initialContent);
  }, [open, note, initialContent]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      if (!trimmedTitle && !trimmedContent) {
        toast.error(t(language, "notes.contentRequired"));
        return;
      }

      setSaving(true);

      try {
        const supabase = createClient();
        const workspaceId = await getWorkspaceId(supabase);

        if (!workspaceId) {
          toast.error(t(language, "common.workspaceNotFound"));
          return;
        }

        const payload = {
          supabase,
          workspaceId,
          title: trimmedTitle,
          content: trimmedContent,
        };

        const result = isEditing
          ? await updateNote({
              ...payload,
              noteId: note.id,
            })
          : await createNote(payload);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        onNoteSaved(result.note);
        onOpenChange(false);
        toast.success(
          isEditing
            ? t(language, "notes.updatedToast")
            : t(language, "notes.createdToast")
        );
      } catch (error) {
        toast.error(formatClientError(error, t(language, "notes.saveError")));
      } finally {
        setSaving(false);
      }
    },
    [content, isEditing, language, note, onNoteSaved, onOpenChange, title]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t(language, "notes.editTitle")
              : t(language, "notes.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t(language, "notes.editDescription")
              : t(language, "notes.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-title">
              {language === "it" ? "Titolo" : "Title"}
            </Label>
            <Input
              id="note-title"
              placeholder={
                language === "it"
                  ? "es. Chiama Mario, Idee bagno"
                  : "e.g. Call Mario, Bathroom ideas"
              }
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="note-content">
              {language === "it" ? "Contenuto" : "Content"}
            </Label>
            <textarea
              id="note-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={saving}
              placeholder={
                language === "it" ? "Scrivi la tua nota..." : "Write your note..."
              }
              rows={8}
              className={cn(
                "min-h-[12rem] w-full resize-y border border-input bg-card px-3 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                radius.control
              )}
              spellCheck
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving || (!title.trim() && !content.trim())}
            >
              {saving
                ? isEditing
                  ? t(language, "common.saving")
                  : t(language, "common.creating")
                : isEditing
                  ? t(language, "common.saveChanges")
                  : t(language, "notes.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
