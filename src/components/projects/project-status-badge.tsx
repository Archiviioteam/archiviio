import {
  formatProjectStatus,
  getProjectStatusPillClass,
} from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import type { ProjectStatus } from "@/types/database";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const language = useAppLanguage();

  return (
    <StatusPillBadge
      label={formatProjectStatus(status, language)}
      pillClass={getProjectStatusPillClass(status)}
      className={className}
    />
  );
}
