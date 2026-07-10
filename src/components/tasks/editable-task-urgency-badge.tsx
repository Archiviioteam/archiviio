"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import { StatusPickerSheet } from "@/components/status/status-picker-sheet";
import { transition } from "@/lib/animation";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import {
  getTaskUrgencyLabel,
  getTaskUrgencyOptions,
  getTaskUrgencyPillClass,
  normalizeTaskUrgency,
  type TaskUrgencyLevel,
} from "@/lib/tasks/urgency";
import { updateTaskUrgency } from "@/lib/tasks/update-task-urgency";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { Task, TaskUrgency } from "@/types/database";

interface EditableTaskUrgencyBadgeProps {
  taskId: string;
  projectId: string;
  title: string;
  urgency: TaskUrgency | null;
  className?: string;
  onUrgencyUpdated?: (urgency: TaskUrgency | null, task?: Task) => void;
}

export function EditableTaskUrgencyBadge({
  taskId,
  projectId,
  title,
  urgency,
  className,
  onUrgencyUpdated,
}: EditableTaskUrgencyBadgeProps) {
  const language = useAppLanguage();
  const [currentUrgency, setCurrentUrgency] = useState(urgency);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) {
      setCurrentUrgency(urgency);
    }
  }, [urgency, saving]);

  const handleOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpen(true);
  }, []);

  const handleSelect = useCallback(
    async (nextLevel: TaskUrgencyLevel) => {
      const nextUrgency: TaskUrgency = nextLevel;
      const normalizedCurrent = currentUrgency
        ? normalizeTaskUrgency(currentUrgency)
        : null;

      if (normalizedCurrent === nextLevel) {
        setOpen(false);
        return;
      }

      setSaving(true);
      setCurrentUrgency(nextUrgency);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(t(language, "common.workspaceNotFound"));
        setSaving(false);
        return;
      }

      const result = await updateTaskUrgency({
        supabase,
        workspaceId,
        taskId,
        projectId,
        title,
        urgency: nextUrgency,
      });

      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        setCurrentUrgency(urgency);
        return;
      }

      onUrgencyUpdated?.(nextUrgency, result.task);
      setOpen(false);
    },
    [currentUrgency, language, onUrgencyUpdated, projectId, taskId, title, urgency]
  );

  const level = currentUrgency ? normalizeTaskUrgency(currentUrgency) : "medium";
  const options = getTaskUrgencyOptions(language).map((option) => ({
    ...option,
    pillClass: getTaskUrgencyPillClass(option.value),
  }));

  return (
    <>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleOpen}
        className={cn(
          "inline-flex h-auto min-h-0 shrink-0 items-center rounded-md border-0 bg-transparent p-0",
          transition.hover,
          "hover:opacity-80"
        )}
        aria-label={
          language === "it" ? "Cambia priorità attività" : "Change task priority"
        }
      >
        {currentUrgency ? (
          <StatusPillBadge
            label={getTaskUrgencyLabel(currentUrgency, language)}
            pillClass={getTaskUrgencyPillClass(level)}
            className={className}
          />
        ) : (
          <StatusPillBadge
            label={language === "it" ? "Priorità" : "Priority"}
            variant="outline"
            className={className}
          />
        )}
      </button>

      <StatusPickerSheet
        open={open}
        onOpenChange={setOpen}
        title={language === "it" ? "Priorità attività" : "Task priority"}
        value={level}
        options={options}
        onSelect={(value) => void handleSelect(value)}
        saving={saving}
      />
    </>
  );
}
