"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { projectListSelectColumns } from "@/lib/projects/schema";
import {
  fetchProjectMembers,
  resolveDefaultAssigneeId,
} from "@/lib/projects/project-members";
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
import { TaskAssigneePicker } from "@/components/tasks/task-assignee-picker";
import { cn } from "@/lib/utils";
import type { MemberProfile } from "@/lib/users/member-display";
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

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function parseDateInputValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [yearText, monthText, dayText] = trimmed.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(year, month - 1, day);

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return trimmed;
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
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<MemberProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
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
    if (!open || !resolvedProjectId) {
      setProjectMembers([]);
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      setLoadingMembers(true);
      const supabase = createClient();
      const members = await fetchProjectMembers(supabase, resolvedProjectId);

      if (cancelled) return;

      setProjectMembers(members);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (task) {
        setAssigneeUserId(
          task.assignee_user_id ??
            resolveDefaultAssigneeId(members, user?.id ?? null)
        );
      } else {
        setAssigneeUserId(resolveDefaultAssigneeId(members, user?.id ?? null));
      }

      setLoadingMembers(false);
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [open, resolvedProjectId, task]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (task) {
      setTitle(task.title);
      setDueDate(toDateInputValue(task.due_date));
      setUrgency(normalizeTaskUrgency(task.urgency));
      setNotes(task.notes ?? "");
      setAssigneeUserId(task.assignee_user_id);
      return;
    }

    setSelectedProjectId("");
    setTitle("");
    setDueDate("");
    setUrgency("medium");
    setNotes("");
    setAssigneeUserId(null);
  }, [open, task]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error(
          language === "it" ? "Il nome attività è obbligatorio." : "Task name is required."
        );
        return;
      }

      if (!resolvedProjectId) {
        toast.error(language === "it" ? "Seleziona un progetto." : "Select a project.");
        return;
      }

      const parsedDueDate = parseDateInputValue(dueDate);
      if (dueDate.trim() && !parsedDueDate) {
        toast.error(
          language === "it"
            ? "Data di scadenza non valida."
            : "Invalid due date."
        );
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        supabase,
        workspaceId,
        projectId: resolvedProjectId,
        title: trimmedTitle,
        dueDate: parsedDueDate,
        urgency,
        notes: notes.trim() || null,
        assigneeUserId,
        currentUserId: user?.id ?? null,
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
      language,
      notes,
      onOpenChange,
      onTaskSaved,
      projects,
      resolvedProjectId,
      task,
      title,
      urgency,
      assigneeUserId,
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
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
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
              autoComplete="off"
              placeholder={
                language === "it" ? "Inserisci nome attività" : "Enter task name"
              }
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          {!loadingMembers && projectMembers.length > 0 ? (
            <TaskAssigneePicker
              members={projectMembers}
              selectedId={assigneeUserId}
              onChange={setAssigneeUserId}
              disabled={saving}
            />
          ) : null}

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
