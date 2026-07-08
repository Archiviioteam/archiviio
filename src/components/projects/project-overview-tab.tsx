"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckSquare, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { AddTaskDialog } from "@/components/projects/add-task-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TaskCard } from "@/components/projects/task-card";
import { stack } from "@/lib/spacing";
import { textStyle } from "@/lib/typography";
import { transition } from "@/lib/animation";
import { createClient } from "@/lib/supabase/client";
import { toggleTaskCompletion } from "@/lib/tasks/toggle-task-completion";
import { getWorkspaceId } from "@/lib/workspace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { cn } from "@/lib/utils";
import type { Project, Task } from "@/types/database";

const UPLOADER_INPUT_ID = "project-overview-document-uploader";

function formatDate(iso: string, language: "it" | "en"): string {
  return new Date(iso).toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProjectOverviewTabProps {
  project: Project;
  onProjectUpdated?: (project: Project) => void;
}

interface OverviewActionButtonProps {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}

function OverviewActionButton({
  icon: Icon,
  label,
  onClick,
}: OverviewActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground",
        transition.hover
      )}
    >
      <Icon className="size-6" />
      <span className={cn(textStyle.bodyMedium, "text-center text-foreground")}>
        {label}
      </span>
    </button>
  );
}

export function ProjectOverviewTab({
  project,
  onProjectUpdated,
}: ProjectOverviewTabProps) {
  const language = useAppLanguage();
  const [editOpen, setEditOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [latestTask, setLatestTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [togglingTask, setTogglingTask] = useState(false);

  const loadLatestTask = useCallback(async () => {
    setLoadingTask(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setLatestTask(null);
      setLoadingTask(false);
      return null;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("project_id", project.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    setLatestTask((data as Task | null) ?? null);
    setLoadingTask(false);
    return workspaceId;
  }, [project.id]);

  useEffect(() => {
    void loadLatestTask();
  }, [loadLatestTask]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeToTaskUpdates() {
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId || !active) {
        return;
      }

      channel = supabase
        .channel(`project-overview-tasks-${project.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `project_id=eq.${project.id}`,
          },
          () => {
            void loadLatestTask();
          }
        )
        .subscribe();
    }

    void subscribeToTaskUpdates();

    return () => {
      active = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadLatestTask, project.id]);

  const handleToggleComplete = useCallback(
    async (task: Task, completed: boolean) => {
      setTogglingTask(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
        setTogglingTask(false);
        return;
      }

      const result = await toggleTaskCompletion({
        supabase,
        workspaceId,
        taskId: task.id,
        projectId: project.id,
        title: task.title,
        completed,
      });

      setTogglingTask(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      await loadLatestTask();
    },
    [language, loadLatestTask, project.id]
  );

  const handleUploadClick = useCallback(() => {
    document.getElementById(UPLOADER_INPUT_ID)?.click();
  }, []);

  const handleTaskSaved = useCallback(() => {
    void loadLatestTask();
    setTaskDialogOpen(false);
  }, [loadLatestTask]);

  return (
    <>
      <div className={cn("flex flex-col", stack.default)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="min-h-48">
            <CardHeader>
              <CardTitle>
                {language === "it" ? "Dettagli progetto" : "Project details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p
                className={cn(
                  "w-full text-foreground",
                  textStyle.bodyLarge,
                  "font-medium leading-relaxed"
                )}
              >
                {formatProjectCodeDisplay(project.code)}
                <br />
                {project.name}
                {project.location ? (
                  <>
                    <br />
                    {project.location}
                  </>
                ) : null}
              </p>

              <div className="flex items-center gap-2">
                <span className={cn(textStyle.caption, "text-muted-foreground")}>
                  {language === "it" ? "Creato" : "Created"}
                </span>
                <span className={cn(textStyle.bodyMedium, "text-foreground")}>
                  {formatDate(project.created_at, language)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(textStyle.caption, "text-muted-foreground")}>
                  {language === "it" ? "Stato" : "Status"}
                </span>
                <ProjectStatusBadge status={project.status} />
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-48">
            <CardContent className="flex h-full min-h-48 items-center justify-center p-6">
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
                <OverviewActionButton
                  icon={Pencil}
                  label={language === "it" ? "Modifica progetto" : "Edit project"}
                  onClick={() => setEditOpen(true)}
                />
                <OverviewActionButton
                  icon={CheckSquare}
                  label={language === "it" ? "Crea attività" : "Create task"}
                  onClick={() => setTaskDialogOpen(true)}
                />
                <OverviewActionButton
                  icon={Upload}
                  label={language === "it" ? "Carica file" : "Upload file"}
                  onClick={handleUploadClick}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DocumentUploader
          projectId={project.id}
          inputId={UPLOADER_INPUT_ID}
          showDropzone={false}
          onUploadComplete={(document) => {
            toast.success(
              language === "it"
                ? `${document.name} caricato`
                : `${document.name} uploaded`
            );
          }}
        />

        {!loadingTask && latestTask ? (
          <TaskCard
            task={latestTask}
            onToggleComplete={handleToggleComplete}
            toggling={togglingTask}
          />
        ) : null}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "it" ? "Modifica progetto" : "Edit project"}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={project}
            onSaved={(updated) => {
              onProjectUpdated?.(updated);
              setEditOpen(false);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AddTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={project.id}
        onTaskSaved={handleTaskSaved}
      />
    </>
  );
}
