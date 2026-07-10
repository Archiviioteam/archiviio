import { Check } from "lucide-react";
import { EditableTaskUrgencyBadge } from "@/components/tasks/editable-task-urgency-badge";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import { Card, CardContent } from "@/components/ui/card";
import { transition } from "@/lib/animation";
import { t } from "@/lib/i18n/translations";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/lib/settings/language";
import {
  getTaskUrgencyLabel,
  getTaskUrgencyPillClass,
  normalizeTaskUrgency,
} from "@/lib/tasks/urgency";
import type { Task, TaskUrgency } from "@/types/database";

import { formatDate } from "@/lib/date-format";

interface TaskCardProps {
  task: Task;
  projectLabel?: string;
  onClick?: (task: Task) => void;
  onToggleComplete?: (task: Task, completed: boolean) => void;
  onUrgencyUpdated?: (task: Task) => void;
  toggling?: boolean;
}

export function TaskCard({
  task,
  projectLabel,
  onClick,
  onToggleComplete,
  onUrgencyUpdated,
  toggling = false,
}: TaskCardProps) {
  const language = useAppLanguage();
  const isDone = task.status === "done";

  return (
    <Card
      variant={onClick ? "interactive" : "default"}
      className={cn(onClick && "cursor-pointer", isDone && "opacity-70")}
      onClick={onClick ? () => onClick(task) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick(task);
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardContent
        className={cn("flex gap-4 p-4", onClick && transition.hover)}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={
            isDone
              ? t(language, "tasks.markIncomplete")
              : t(language, "tasks.markComplete")
          }
          disabled={toggling}
          onClick={(event) => {
            event.stopPropagation();
            onToggleComplete?.(task, !isDone);
          }}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 border-input bg-card",
            radius.control,
            transition.hover,
            isDone && "border-primary bg-primary text-primary-foreground",
            toggling && "opacity-50"
          )}
        >
          {isDone ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {projectLabel ? (
            <span
              className={cn(textStyle.bodyMedium, "truncate text-muted-foreground")}
            >
              {projectLabel}
            </span>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span
              className={cn(
                textStyle.pageTitle,
                "min-w-0 flex-1 truncate text-foreground",
                isDone && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </span>

            <span
              className={cn(
                textStyle.caption,
                "shrink-0 text-muted-foreground sm:text-right",
                !task.due_date && "italic"
              )}
            >
              {task.due_date ? formatDate(task.due_date) : "—"}
            </span>

            {task.project_id ? (
              <div
                className="shrink-0"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <EditableTaskUrgencyBadge
                  taskId={task.id}
                  projectId={task.project_id}
                  title={task.title}
                  urgency={task.urgency}
                  onUrgencyUpdated={(_urgency: TaskUrgency | null, updated) => {
                    if (updated) {
                      onUrgencyUpdated?.(updated);
                    }
                  }}
                />
              </div>
            ) : task.urgency ? (
              <StatusPillBadge
                label={getTaskUrgencyLabel(task.urgency, language)}
                pillClass={getTaskUrgencyPillClass(normalizeTaskUrgency(task.urgency))}
              />
            ) : (
              <span
                className={cn(textStyle.caption, "shrink-0 text-muted-foreground")}
              >
                —
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            {task.notes ? (
              <p
                className={cn(
                  textStyle.body,
                  "min-w-0 flex-1 text-justify text-muted-foreground"
                )}
              >
                <span className={textStyle.bodyMedium}>
                  {t(language, "tasks.notePrefix")}
                </span>
                <span className="whitespace-pre-wrap">{task.notes}</span>
              </p>
            ) : (
              <span className="min-w-0 flex-1" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
