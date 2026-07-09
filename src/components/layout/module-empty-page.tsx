"use client";

import { PageContent, PageLayout } from "@/components/layout/page-layout";
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
  const defaultEmptyState = modulePageEmptyStates[module];
  const emptyState =
    module === "documents"
      ? {
          icon: defaultEmptyState.icon,
          message: t(language, "documents.emptyTitle"),
          actionLabel: t(language, "documents.uploadTitle"),
        }
      : defaultEmptyState;

  const content = (
    <EmptyState
      icon={plain ? undefined : emptyState.icon}
      title={emptyState.message}
      action={{ label: emptyState.actionLabel }}
    />
  );

  return (
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
  );
}
