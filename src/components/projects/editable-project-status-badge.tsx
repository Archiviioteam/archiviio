"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { StatusPickerPopover } from "@/components/status/status-picker-popover";
import { transition } from "@/lib/animation";
import { t } from "@/lib/i18n/translations";
import { getProjectStatusOptions } from "@/lib/projects";
import { updateProject } from "@/lib/projects/update-project";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types/database";

interface EditableProjectStatusBadgeProps {
  projectId: string;
  status: ProjectStatus;
  className?: string;
  onStatusUpdated?: (status: ProjectStatus, project?: Project) => void;
}

export function EditableProjectStatusBadge({
  projectId,
  status,
  className,
  onStatusUpdated,
}: EditableProjectStatusBadgeProps) {
  const language = useAppLanguage();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) {
      setCurrentStatus(status);
    }
  }, [status, saving]);

  const handleSelect = useCallback(
    async (nextStatus: ProjectStatus) => {
      if (nextStatus === currentStatus) {
        setOpen(false);
        return;
      }

      setSaving(true);
      setCurrentStatus(nextStatus);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(t(language, "common.workspaceNotFound"));
        setSaving(false);
        return;
      }

      const result = await updateProject({
        supabase,
        workspaceId,
        projectId,
        status: nextStatus,
      });

      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        setCurrentStatus(status);
        return;
      }

      onStatusUpdated?.(nextStatus, result.project);
      setOpen(false);
    },
    [currentStatus, language, onStatusUpdated, projectId, status]
  );

  return (
    <StatusPickerPopover
      open={open}
      onOpenChange={setOpen}
      value={currentStatus}
      options={getProjectStatusOptions(language)}
      onSelect={(value) => void handleSelect(value)}
      saving={saving}
      trigger={
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "inline-flex h-auto min-h-0 shrink-0 items-center rounded-md border-0 bg-transparent p-0",
            transition.hover,
            "hover:opacity-80"
          )}
          aria-label={
            language === "it" ? "Cambia stato progetto" : "Change project status"
          }
        >
          <ProjectStatusBadge status={currentStatus} className={className} />
        </button>
      }
    />
  );
}
