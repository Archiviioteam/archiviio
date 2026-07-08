"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export function DashboardNotesComposer() {
  const router = useRouter();
  const language = useAppLanguage();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

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
    toast.success(t(language, "notes.createdToast"));
    router.push("/notes");
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
