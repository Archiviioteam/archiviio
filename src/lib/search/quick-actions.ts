import type { LucideIcon } from "lucide-react";
import {
  FolderPlus,
  Truck,
  Upload,
  UserPlus,
} from "lucide-react";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import { t } from "@/lib/i18n/translations";

export type QuickActionId =
  | "create-project"
  | "create-contact"
  | "upload-document"
  | "create-supplier";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  keywords: string[];
  icon: LucideIcon;
}

export function getQuickActions(language: AppLanguage = "en"): QuickAction[] {
  return [
    {
      id: "create-project",
      label: t(language, "quickActions.createProject"),
      keywords: ["new", "project", "add", "create", "nuovo", "progetto"],
      icon: FolderPlus,
    },
    {
      id: "create-contact",
      label: t(language, "quickActions.createContact"),
      keywords: ["new", "contact", "client", "add", "create", "contatto"],
      icon: UserPlus,
    },
    {
      id: "upload-document",
      label: t(language, "quickActions.uploadDocument"),
      keywords: [
        "upload",
        "document",
        "file",
        "add",
        "attach",
        "carica",
        "elaborato",
        "elaborati",
      ],
      icon: Upload,
    },
    {
      id: "create-supplier",
      label: t(language, "quickActions.createSupplier"),
      keywords: ["supplier", "vendor", "fornitore", "add", "create", "new"],
      icon: Truck,
    },
  ];
}

export const QUICK_ACTIONS: QuickAction[] = getQuickActions("en");

export function filterQuickActions(
  query: string,
  language: AppLanguage = "en"
): QuickAction[] {
  const actions = getQuickActions(language);
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return actions;
  }

  return actions.filter((action) => {
    const labelMatch = action.label.toLowerCase().includes(normalized);
    const keywordMatch = action.keywords.some((keyword) =>
      keyword.toLowerCase().includes(normalized)
    );

    return labelMatch || keywordMatch;
  });
}

export function quickActionSearchValue(action: QuickAction): string {
  return [action.label, ...action.keywords, action.id].join(" ");
}
