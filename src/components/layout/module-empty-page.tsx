"use client";

import { useState } from "react";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { UploadDocumentDialog } from "@/components/search/upload-document-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/translations";
import {
  modulePageEmptyStates,
  type ModulePageId,
} from "@/lib/module-empty-states";
import { useAppLanguage } from "@/lib/settings/language";

interface ModuleEmptyPageProps {
  module: ModulePageId;
  plain?: boolean;
}

export function ModuleEmptyPage({ module, plain = false }: ModuleEmptyPageProps) {
  const language = useAppLanguage();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const defaultEmptyState = modulePageEmptyStates[module];
  const emptyState =
    module === "documents"
      ? {
          icon: defaultEmptyState.icon,
          message: t(language, "documents.emptyTitle"),
          actionLabel: t(language, "quickActions.uploadDocument"),
        }
      : defaultEmptyState;

  const content = (
    <EmptyState
      icon={plain ? undefined : emptyState.icon}
      title={emptyState.message}
      action={
        module === "documents"
          ? {
              label: emptyState.actionLabel,
              onClick: () => setIsUploadDialogOpen(true),
            }
          : { label: emptyState.actionLabel }
      }
    />
  );

  return (
    <>
      <PageLayout>
        <PageContent>
          {plain ? (
            content
          ) : (
            <Card>
              <CardContent className="p-6">{content}</CardContent>
            </Card>
          )}
        </PageContent>
      </PageLayout>

      {module === "documents" ? (
        <UploadDocumentDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        />
      ) : null}
    </>
  );
}
