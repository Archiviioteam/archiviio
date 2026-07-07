"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddNomenclatureRuleDialog } from "@/components/nomenclature/add-nomenclature-rule-dialog";
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
import { deleteNomenclatureRule } from "@/lib/nomenclature/delete-rule";
import { fetchWorkspaceNomenclatureRules } from "@/lib/nomenclature/fetch-workspace-rules";
import { createClient } from "@/lib/supabase/client";
import { formatClientError } from "@/lib/supabase/format-error";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { WorkspaceNomenclatureRule } from "@/types/database";

export function NomenclatureContent() {
  const language = useAppLanguage();
  const [rules, setRules] = useState<WorkspaceNomenclatureRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkspaceNomenclatureRule | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] =
    useState<WorkspaceNomenclatureRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setRules([]);
        setLoadError(t(language, "common.workspaceNotFound"));
        setLoading(false);
        return;
      }

      const result = await fetchWorkspaceNomenclatureRules(
        supabase,
        workspaceId
      );
      setRules(result.rules);

      if (!result.ok) {
        setLoadError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      const message = formatClientError(
        error,
        t(language, "nomenclature.loadError")
      );
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const openCreateDialog = useCallback(() => {
    setEditingRule(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((rule: WorkspaceNomenclatureRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingRule(null);
    }
  }, []);

  const handleRuleSaved = useCallback((rule: WorkspaceNomenclatureRule) => {
    setRules((current) => {
      const exists = current.some((item) => item.id === rule.id);
      const next = exists
        ? current.map((item) => (item.id === rule.id ? rule : item))
        : [...current, rule];

      return next.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
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
      toast.error(t(language, "common.workspaceNotFound"));
      setDeleting(false);
      return;
    }

    const result = await deleteNomenclatureRule({
      supabase,
      workspaceId,
      ruleId: deleteTarget.id,
    });

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      t(language, "nomenclature.deletedToast").replace(
        "{name}",
        deleteTarget.title
      )
    );
    setRules((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget, language]);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "nomenclature.loading")}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          {rules.length > 0 ? (
            <>
              <div className="flex justify-end">
                <Button type="button" onClick={openCreateDialog}>
                  <Plus />
                  {t(language, "nomenclature.addTitle")}
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {rules.map((rule) => (
                  <Card
                    key={rule.id}
                    className="cursor-pointer transition-colors hover:bg-muted/20"
                    onClick={() => openEditDialog(rule)}
                  >
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className={cn(textStyle.bodyMedium, "text-foreground")}>
                          {rule.title}
                        </p>
                        {rule.notes ? (
                          <p
                            className={cn(
                              textStyle.body,
                              "mt-2 whitespace-pre-wrap text-muted-foreground"
                            )}
                          >
                            {rule.notes}
                          </p>
                        ) : (
                          <p
                            className={cn(
                              textStyle.body,
                              "mt-2 text-muted-foreground/70"
                            )}
                          >
                            {t(language, "nomenclature.noNotes")}
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
                          setDeleteTarget(rule);
                        }}
                        aria-label={t(language, "nomenclature.deleteAria").replace(
                          "{name}",
                          rule.title
                        )}
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
                <Button type="button" variant="outline" onClick={() => void loadRules()}>
                  {t(language, "common.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={BookOpen}
                  action={{
                    label: t(language, "nomenclature.addTitle"),
                    onClick: openCreateDialog,
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>

      <AddNomenclatureRuleDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        rule={editingRule}
        onRuleSaved={handleRuleSaved}
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
            <DialogTitle>{t(language, "nomenclature.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "nomenclature.deleteDescription").replace(
                "{name}",
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
