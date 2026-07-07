"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { projectListSelectColumns } from "@/lib/projects/schema";
import { createTask } from "@/lib/tasks/create-task";
import { deleteTask } from "@/lib/tasks/delete-task";
import {
  getTaskUrgencyPillClass,
  getTaskUrgencyOptions,
  normalizeTaskUrgency,
  type TaskUrgencyLevel,
} from "@/lib/tasks/urgency";
import { updateTask } from "@/lib/tasks/update-task";
import { getWorkspaceId } from "@/lib/workspace";
import { statusPillSelectorClass } from "@/lib/status-pills";
import { useAppLanguage } from "@/lib/settings/language";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Project, Task } from "@/types/database";

export interface TaskSavedContext {
  projectName: string | null;
  projectCode: string | null;
}

const fieldClassName = cn(
  "flex w-full border border-input bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

const selectClassName = cn(
  "flex h-12 w-full cursor-pointer appearance-none border border-input bg-card px-3 py-2 pr-10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

function buildReminderAt(date: string, time: string): string | null {
  if (!date || !time) {
    return null;
  }

  const reminder = new Date(`${date}T${time}`);
  if (Number.isNaN(reminder.getTime())) {
    return null;
  }

  return reminder.toISOString();
}

function parseReminderAt(value: string | null): {
  date: string;
  time: string;
} {
  if (!value) {
    return { date: "", time: "" };
  }

  const reminder = new Date(value);
  if (Number.isNaN(reminder.getTime())) {
    return { date: "", time: "" };
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return {
    date: `${reminder.getFullYear()}-${pad(reminder.getMonth() + 1)}-${pad(reminder.getDate())}`,
    time: `${pad(reminder.getHours())}:${pad(reminder.getMinutes())}`,
  };
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  allowProjectSelection?: boolean;
  task?: Task | null;
  onTaskSaved: (task: Task, context?: TaskSavedContext) => void;
  onTaskDeleted?: (taskId: string) => void;
}

function formatProjectOptionLabel(project: Project): string {
  const code = formatProjectCodeDisplay(project.code);
  return `${code} - ${project.name}`;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  projectId,
  allowProjectSelection = false,
  task = null,
  onTaskSaved,
  onTaskDeleted,
}: AddTaskDialogProps) {
  const language = useAppLanguage();
  const isEditing = task !== null;
  const showProjectSelector = allowProjectSelection && !isEditing;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [urgency, setUrgency] = useState<TaskUrgencyLevel>("medium");
  const [notes, setNotes] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const resolvedProjectId = isEditing
    ? (projectId ?? task?.project_id ?? "")
    : showProjectSelector
      ? selectedProjectId
      : (projectId ?? "");

  useEffect(() => {
    if (!open || !showProjectSelector) {
      return;
    }

    async function loadProjects() {
      setLoadingProjects(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }

      const columns = await projectListSelectColumns(supabase);
      const { data } = await supabase
        .from("projects")
        .select(columns)
        .eq("workspace_id", workspaceId)
        .order("name");

      setProjects((data as unknown as Project[]) ?? []);
      setLoadingProjects(false);
    }

    void loadProjects();
  }, [open, showProjectSelector]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (task) {
      setTitle(task.title);
      setDueDate(task.due_date ?? "");
      setUrgency(normalizeTaskUrgency(task.urgency));
      setNotes(task.notes ?? "");
      const reminder = parseReminderAt(task.reminder_at);
      setReminderDate(reminder.date);
      setReminderTime(reminder.time);
      return;
    }

    setSelectedProjectId("");
    setTitle("");
    setDueDate("");
    setUrgency("medium");
    setNotes("");
    setReminderDate("");
    setReminderTime("");
  }, [open, task]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error(
          language === "it" ? "Il nome attività e obbligatorio." : "Task name is required."
        );
        return;
      }

      if (!resolvedProjectId) {
        toast.error(language === "it" ? "Seleziona un progetto." : "Select a project.");
        return;
      }

      setSaving(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
        setSaving(false);
        return;
      }

      const payload = {
        supabase,
        workspaceId,
        projectId: resolvedProjectId,
        title: trimmedTitle,
        dueDate: dueDate || null,
        urgency,
        notes: notes.trim() || null,
        reminderAt: buildReminderAt(reminderDate, reminderTime),
      };

      const result = isEditing
        ? await updateTask({
            ...payload,
            taskId: task.id,
          })
        : await createTask(payload);

      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const selectedProject = projects.find(
        (project) => project.id === resolvedProjectId
      );

      onTaskSaved(result.task, {
        projectName: selectedProject?.name ?? null,
        projectCode: selectedProject?.code ?? null,
      });
      onOpenChange(false);
      toast.success(
        isEditing
          ? language === "it"
            ? "Attività aggiornata"
            : "Task updated"
          : language === "it"
            ? "Attività creata"
            : "Task created"
      );
    },
    [
      dueDate,
      isEditing,
      notes,
      onOpenChange,
      onTaskSaved,
      projects,
      reminderDate,
      reminderTime,
      resolvedProjectId,
      task,
      title,
      urgency,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!task) {
      return;
    }

    setDeleting(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setDeleting(false);
      return;
    }

    const result = await deleteTask({
      supabase,
      workspaceId,
      taskId: task.id,
      projectId: resolvedProjectId,
      title: task.title,
    });

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onTaskDeleted?.(task.id);
    onOpenChange(false);
    toast.success(language === "it" ? "Attività eliminata" : "Task deleted");
  }, [language, onOpenChange, onTaskDeleted, resolvedProjectId, task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? language === "it"
                ? "Modifica attività"
                : "Edit task"
              : language === "it"
                ? "Aggiungi attività"
                : "Add task"}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {showProjectSelector ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-project">{language === "it" ? "Progetto" : "Project"}</Label>
              {loadingProjects ? (
                <p className={cn(textStyle.body, "text-muted-foreground")}>
                  {language === "it" ? "Caricamento progetti..." : "Loading projects..."}
                </p>
              ) : projects.length === 0 ? (
                <p className={cn(textStyle.body, "text-muted-foreground")}>
                  {language === "it"
                    ? "Nessun progetto disponibile. Crea prima un progetto."
                    : "No projects available. Create a project first."}
                </p>
              ) : (
                <div className="relative">
                  <select
                    id="task-project"
                    value={selectedProjectId}
                    onChange={(event) =>
                      setSelectedProjectId(event.target.value)
                    }
                    disabled={saving}
                    className={cn(
                      selectClassName,
                      !selectedProjectId && "text-muted-foreground"
                    )}
                  >
                    <option value="">
                      {language === "it" ? "Seleziona un progetto" : "Select a project"}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {formatProjectOptionLabel(project)}
                      </option>
                    ))}
                  </select>
                  <ChevronsUpDown
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-name">
              {language === "it" ? "Nome attività" : "Task name"}
            </Label>
            <Input
              id="task-name"
              autoFocus
              placeholder={
                language === "it" ? "Inserisci nome attività" : "Enter task name"
              }
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-deadline">
              {language === "it" ? "Scadenza" : "Deadline"}
            </Label>
            <Input
              id="task-deadline"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{language === "it" ? "Urgenza" : "Urgency"}</Label>
            <div
              className="flex gap-2"
              role="group"
              aria-label={language === "it" ? "Urgenza" : "Urgency"}
            >
              {getTaskUrgencyOptions(language).map((option) => {
                const selected = urgency === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setUrgency(option.value)}
                    disabled={saving}
                    className={cn(
                      statusPillSelectorClass,
                      selected
                        ? cn(
                            getTaskUrgencyPillClass(option.value),
                            "text-black"
                          )
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {language === "it"
                      ? option.value === "low"
                        ? "Bassa"
                        : option.value === "medium"
                          ? "Media"
                          : "Alta"
                      : option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-notes">{language === "it" ? "Note" : "Notes"}</Label>
            <textarea
              id="task-notes"
              placeholder={
                language === "it" ? "Aggiungi note aggiuntive..." : "Add additional notes..."
              }
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              rows={4}
              className={cn(fieldClassName, "min-h-24 resize-y py-3")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{language === "it" ? "Promemoria" : "Reminder"}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-reminder-date" className={textStyle.caption}>
                  {language === "it" ? "Giorno" : "Day"}
                </Label>
                <Input
                  id="task-reminder-date"
                  type="date"
                  value={reminderDate}
                  onChange={(event) => setReminderDate(event.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-reminder-time" className={textStyle.caption}>
                  {language === "it" ? "Ora" : "Time"}
                </Label>
                <Input
                  id="task-reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={saving || deleting}
              >
                {deleting
                  ? language === "it"
                    ? "Eliminazione..."
                    : "Deleting..."
                  : language === "it"
                    ? "Elimina"
                    : "Delete"}
              </Button>
            ) : (
              <span />
            )}

            <div className="flex flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving || deleting}
              >
                {language === "it" ? "Annulla" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  deleting ||
                  !title.trim() ||
                  (showProjectSelector && !selectedProjectId)
                }
              >
                {saving
                  ? isEditing
                    ? language === "it"
                      ? "Salvataggio..."
                      : "Saving..."
                    : language === "it"
                      ? "Creazione..."
                      : "Creating..."
                  : isEditing
                    ? language === "it"
                      ? "Salva modifiche"
                      : "Save changes"
                    : language === "it"
                      ? "Crea attività"
                      : "Create task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
