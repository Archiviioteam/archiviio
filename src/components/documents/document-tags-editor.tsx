"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDocumentTags } from "@/lib/documents/document-actions";
import {
  normalizeDocumentTag,
  normalizeDocumentTags,
  SUGGESTED_DOCUMENT_TAGS,
} from "@/lib/documents/document-tags";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

interface DocumentTagsEditorProps {
  document: Document;
  onTagsUpdated: (document: Document) => void;
}

export function DocumentTagsEditor({
  document,
  onTagsUpdated,
}: DocumentTagsEditorProps) {
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);

  const tags = normalizeDocumentTags(document.tags);
  const availableSuggestedTags = SUGGESTED_DOCUMENT_TAGS.filter(
    (tag) => !tags.includes(tag)
  );

  const saveTags = async (nextTags: string[]) => {
    setSaving(true);

    const supabase = createClient();
    const result = await updateDocumentTags(
      supabase,
      document.id,
      normalizeDocumentTags(nextTags)
    );

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onTagsUpdated(result.document);
  };

  const addTag = (tag: string) => {
    const normalized = normalizeDocumentTag(tag);
    if (!normalized || tags.includes(normalized)) return;
    void saveTags([...tags, normalized]);
  };

  const removeTag = (tag: string) => {
    void saveTags(tags.filter((currentTag) => currentTag !== tag));
  };

  const handleCustomTagSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addTag(customTag);
    setCustomTag("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">No tags</span>
        ) : (
          tags.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={saving}
              onClick={() => removeTag(tag)}
              className={cn(
                "inline-flex items-center gap-1 border border-border bg-muted px-3 py-1 text-xs text-foreground hover:bg-accent",
                radius.pill,
                transition.hover,
                saving && "opacity-60"
              )}
            >
              {tag}
              <X className="size-4" />
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {availableSuggestedTags.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant="outline"
            size="xs"
            disabled={saving}
            onClick={() => addTag(tag)}
          >
            + {tag}
          </Button>
        ))}

        <form
          onSubmit={handleCustomTagSubmit}
          className="flex min-w-16 flex-1 items-center gap-2"
        >
          <Input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="Add custom tag"
            disabled={saving}
            className="h-8 text-xs"
          />
          <Button type="submit" variant="secondary" size="xs" disabled={saving}>
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
