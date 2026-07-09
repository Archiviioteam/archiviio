"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCommandEnterShortcutLabel } from "@/lib/layout/keyboard-shortcuts";
import { createNote } from "@/lib/notes/create-note";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/translations";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { getWorkspaceId } from "@/lib/workspace";
import type { WorkspaceNote } from "@/types/database";

function formatNoteDate(value: string, language: "it" | "en"): string {
  return new Date(value).toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DashboardNotesComposer() {
  const language = useAppLanguage();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [latestNote, setLatestNote] = useState<WorkspaceNote | null>(null);
  const [loadingLatestNote, setLoadingLatestNote] = useState(true);

  const loadLatestNote = useCallback(async () => {
    setLoadingLatestNote(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setLatestNote(null);
      setLoadingLatestNote(false);
      return;
    }

    const { data } = await supabase
      .from("workspace_notes")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestNote((data as WorkspaceNote | null) ?? null);
    setLoadingLatestNote(false);
  }, []);

  useEffect(() => {
    void loadLatestNote();
  }, [loadLatestNote]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) {
      toast.error(t(language, "notes.contentRequired"));
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(t(language, "common.workspaceNotFound"));
      setSaving(false);
      return;
    }

    const result = await createNote({
      supabase,
      workspaceId,
      title: trimmedTitle,
      content: trimmedContent,
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setTitle("");
    setContent("");
    setLatestNote(result.note);
    toast.success(t(language, "notes.createdToast"));
  }

  function handleSubmitShortcut(
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (!saving && (title.trim() || content.trim())) {
        void handleSubmit(event);
      }
    }
  }

  return (
    <form
      className="flex min-h-0 w-full flex-1 flex-col gap-3"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Input
        placeholder={t(language, "notes.optionalTitle")}
        className="h-9 shrink-0"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleSubmitShortcut}
        disabled={saving}
      />

      <Textarea
        placeholder={t(language, "notes.write")}
        className="min-h-0 flex-1 resize-none"
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleSubmitShortcut}
        disabled={saving}
      />

      {!loadingLatestNote && latestNote ? (
        <Card variant="nested" className="shrink-0">
          <div className="flex flex-col gap-1 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  textStyle.captionMedium,
                  "min-w-0 truncate text-foreground"
                )}
              >
                {latestNote.title}
              </span>
              <span
                className={cn(
                  textStyle.caption,
                  "shrink-0 text-muted-foreground"
                )}
              >
                {formatNoteDate(latestNote.created_at, language)}
              </span>
            </div>
            {latestNote.content ? (
              <p
                className={cn(
                  textStyle.caption,
                  "line-clamp-2 whitespace-pre-wrap text-muted-foreground"
                )}
              >
                {latestNote.content}
              </p>
            ) : (
              <p className={cn(textStyle.caption, "text-muted-foreground/70")}>
                {t(language, "notes.noContent")}
              </p>
            )}
          </div>
        </Card>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={saving || (!title.trim() && !content.trim())}
        >
          {t(language, "notes.send")}
        </Button>
        <kbd
          className={cn(
            "hidden shrink-0 text-muted-foreground/40 sm:inline",
            textStyle.captionMedium
          )}
        >
          {getCommandEnterShortcutLabel()}
        </kbd>
      </div>
    </form>
  );
}
