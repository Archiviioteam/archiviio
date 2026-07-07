"use client";

import {
  FolderPlus,
  Truck,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardPanelInnerGapClass } from "@/lib/dashboard-layout";
import { t, type TranslationKey } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

type QuickActionId =
  | "new-project"
  | "new-contact"
  | "upload-document"
  | "new-supplier";

const quickActions: Array<{ id: QuickActionId; labelKey: TranslationKey; icon: LucideIcon }> = [
  { id: "new-project", labelKey: "quickActions.createProject", icon: FolderPlus },
  { id: "new-contact", labelKey: "quickActions.createContact", icon: UserPlus },
  { id: "upload-document", labelKey: "quickActions.uploadDocument", icon: Upload },
  { id: "new-supplier", labelKey: "quickActions.createSupplier", icon: Truck },
];

interface DashboardQuickActionsProps {
  onActionClick: (actionId: QuickActionId) => void;
}

export function DashboardQuickActions({ onActionClick }: DashboardQuickActionsProps) {
  const language = useAppLanguage();

  return (
    <div
      className={cn(
        "grid h-full min-h-0 flex-1 grid-cols-2 grid-rows-2",
        dashboardPanelInnerGapClass
      )}
    >
      {quickActions.map((action) => {
        const Icon = action.icon;

        return (
          <Card key={action.id} variant="nested" className="h-full min-h-0" asChild>
            <button
              type="button"
              className="flex h-full min-h-0 flex-col items-center justify-center gap-2 p-3"
              onClick={() => onActionClick(action.id)}
            >
              <Icon className="size-5 text-muted-foreground" />
              <span
                className={cn(
                  textStyle.captionMedium,
                  "text-center text-foreground"
                )}
              >
                {t(language, action.labelKey)}
              </span>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
