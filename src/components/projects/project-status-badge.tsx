import { Badge } from "@/components/ui/badge";
import {
  formatProjectStatus,
  getProjectStatusPillClass,
} from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { statusPillBadgeClass } from "@/lib/status-pills";
import { cn } from "@/lib/utils";
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
    <Badge
      size="sm"
      className={cn(
        statusPillBadgeClass,
        "text-black",
        getProjectStatusPillClass(status),
        className
      )}
    >
      {formatProjectStatus(status, language)}
    </Badge>
  );
}
