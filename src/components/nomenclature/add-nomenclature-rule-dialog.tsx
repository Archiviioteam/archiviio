"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createNomenclatureRule } from "@/lib/nomenclature/create-rule";
import { updateNomenclatureRule } from "@/lib/nomenclature/update-rule";
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
import type { WorkspaceNomenclatureRule } from "@/types/database";

interface AddNomenclatureRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: WorkspaceNomenclatureRule | null;
  onRuleSaved: (rule: WorkspaceNomenclatureRule) => void;
}

export function AddNomenclatureRuleDialog({
  open,
  onOpenChange,
  rule = null,
  onRuleSaved,
}: AddNomenclatureRuleDialogProps) {
  const language = useAppLanguage();
  const isEditing = rule !== null;
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (rule) {
      setTitle(rule.title);
      setNotes(rule.notes);
      return;
    }

    setTitle("");
    setNotes("");
  }, [open, rule]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error(t(language, "nomenclature.titleRequired"));
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
          notes,
        };

        const result = isEditing
          ? await updateNomenclatureRule({
              ...payload,
              ruleId: rule.id,
            })
          : await createNomenclatureRule(payload);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        onRuleSaved(result.rule);
        onOpenChange(false);
        toast.success(
          isEditing
            ? t(language, "nomenclature.updatedToast")
            : t(language, "nomenclature.createdToast")
        );
      } catch (error) {
        toast.error(
          formatClientError(error, t(language, "nomenclature.saveError"))
        );
      } finally {
        setSaving(false);
      }
    },
    [isEditing, language, notes, onOpenChange, onRuleSaved, rule, title]
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
              ? t(language, "nomenclature.editTitle")
              : t(language, "nomenclature.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t(language, "nomenclature.editDescription")
              : t(language, "nomenclature.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nomenclature-title">
              {language === "it" ? "Titolo" : "Title"}
            </Label>
            <Input
              id="nomenclature-title"
              placeholder={
                language === "it"
                  ? "es. File progetto, Disegni, Report"
                  : "e.g. Project files, Drawings, Reports"
              }
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nomenclature-notes">
              {language === "it" ? "Note" : "Notes"}
            </Label>
            <textarea
              id="nomenclature-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              placeholder={
                language === "it"
                  ? "Descrivi come nominare file, cartelle o progetti..."
                  : "Describe how to name files, folders, or projects..."
              }
              rows={8}
              className={cn(
                "min-h-[12rem] w-full resize-y border border-input bg-card px-3 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                radius.control
              )}
              spellCheck={false}
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
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving
                ? isEditing
                  ? t(language, "common.saving")
                  : t(language, "common.creating")
                : isEditing
                  ? t(language, "common.saveChanges")
                  : t(language, "nomenclature.addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
