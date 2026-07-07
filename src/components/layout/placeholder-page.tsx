"use client";

import {
  BookOpen,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  StickyNote,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const icons = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  tasks: CheckSquare,
  contacts: Users,
  suppliers: Truck,
  documents: FileText,
  notes: StickyNote,
  nomenclature: BookOpen,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

type PlaceholderIcon = keyof typeof icons;

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: PlaceholderIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  const Icon = icons[icon];

  return (
    <EmptyState fill icon={Icon} title={title} description={description} />
  );
}
