"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckSquare, FileText, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { AddTaskDialog } from "@/components/projects/add-task-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { EditableProjectStatusBadge } from "@/components/projects/editable-project-status-badge";
import { textStyle } from "@/lib/typography";
import { radius } from "@/lib/theme";
import {
  dashboardGridClassDesktop,
  dashboardGridClassMobile,
  dashboardGridGapClass,
  dashboardPanelClassDesktop,
  dashboardPanelClassMobile,
  dashboardPanelContentClass,
} from "@/lib/dashboard-layout";
import { transition } from "@/lib/animation";
import {
  formatUploadDate,
  getFileTypeLabel,
} from "@/lib/documents/document-utils";
import { t } from "@/lib/i18n/translations";
import { projectHref } from "@/lib/search/search-routes";
import { createClient } from "@/lib/supabase/client";
import { toggleTaskCompletion } from "@/lib/tasks/toggle-task-completion";
import { getWorkspaceId } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/date-format";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { cn } from "@/lib/utils";
import type { Document, Project, Task } from "@/types/database";

const UPLOADER_INPUT_ID = "project-overview-document-uploader";
const RECENT_TASKS_LIMIT = 5;
const RECENT_DOCUMENTS_LIMIT = 4;

interface OverviewTaskReminderProps {
  task: Task;
  language: "it" | "en";
  toggling: boolean;
  onToggleComplete: (task: Task, completed: boolean) => void;
}

function OverviewTaskReminder({
  task,
  language,
  toggling,
  onToggleComplete,
}: OverviewTaskReminderProps) {
  const isDone = task.status === "done";

  return (
    <Card variant="nested" className={cn(isDone && "opacity-75")}>
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={
            isDone
              ? language === "it"
                ? "Segna come da fare"
                : "Mark as incomplete"
              : language === "it"
                ? "Segna come completata"
                : "Mark as complete"
          }
          disabled={toggling}
          onClick={() => onToggleComplete(task, !isDone)}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center border-2 border-input bg-card",
            radius.control,
            transition.hover,
            isDone && "border-primary bg-primary text-primary-foreground",
            toggling && "opacity-50"
          )}
        >
          {isDone ? <Check className="size-2.5" strokeWidth={3} /> : null}
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span
            className={cn(
              textStyle.captionMedium,
              "min-w-0 truncate text-foreground",
              isDone && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          <span className={cn(textStyle.caption, "shrink-0 text-muted-foreground")}>
            {formatDate(task.due_date)}
          </span>
        </div>
      </div>
    </Card>
  );
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
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const loadRecentTasks = useCallback(async () => {
    setLoadingTasks(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setRecentTasks([]);
      setLoadingTasks(false);
      return null;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("project_id", project.id)
      .order("updated_at", { ascending: false })
      .limit(RECENT_TASKS_LIMIT);

    setRecentTasks((data as Task[]) ?? []);
    setLoadingTasks(false);
    return workspaceId;
  }, [project.id]);

  const loadRecentDocuments = useCallback(async () => {
    setLoadingDocuments(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setRecentDocuments([]);
      setLoadingDocuments(false);
      return;
    }

    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(RECENT_DOCUMENTS_LIMIT);

    setRecentDocuments(
      ((data as Document[]) ?? []).map((document) => ({
        ...document,
        tags: document.tags ?? [],
      }))
    );
    setLoadingDocuments(false);
  }, [project.id]);

  useEffect(() => {
    void loadRecentTasks();
  }, [loadRecentTasks]);

  useEffect(() => {
    void loadRecentDocuments();
  }, [loadRecentDocuments]);

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
            void loadRecentTasks();
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
  }, [loadRecentTasks, project.id]);

  const handleToggleComplete = useCallback(
    async (task: Task, completed: boolean) => {
      setTogglingTaskId(task.id);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
        setTogglingTaskId(null);
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

      setTogglingTaskId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      await loadRecentTasks();
    },
    [language, loadRecentTasks, project.id]
  );

  const handleUploadClick = useCallback(() => {
    document.getElementById(UPLOADER_INPUT_ID)?.click();
  }, []);

  const handleTaskSaved = useCallback(() => {
    void loadRecentTasks();
    setTaskDialogOpen(false);
  }, [loadRecentTasks]);

  const panelClass = cn(dashboardPanelClassMobile, dashboardPanelClassDesktop);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          data-dashboard-grid
          className={cn(
            dashboardGridClassMobile,
            dashboardGridClassDesktop,
            dashboardGridGapClass,
            "min-h-0 flex-1"
          )}
        >
          <DashboardSection
            title={language === "it" ? "Dettagli progetto" : "Project details"}
            className={panelClass}
          >
            <div className="flex flex-col gap-4">
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
                  {formatDate(project.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(textStyle.caption, "text-muted-foreground")}>
                  {language === "it" ? "Stato" : "Status"}
                </span>
                <EditableProjectStatusBadge
                  projectId={project.id}
                  status={project.status}
                  onStatusUpdated={(status, updated) => {
                    onProjectUpdated?.(updated ?? { ...project, status });
                  }}
                />
              </div>
            </div>
          </DashboardSection>

          <Card
            data-dashboard-panel
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden",
              "h-auto max-lg:h-auto lg:h-full",
              panelClass
            )}
          >
            <CardContent
              className={cn(
                dashboardPanelContentClass,
                "flex min-h-0 flex-1 items-center justify-center"
              )}
            >
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:h-full">
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

          <DashboardSection
            title={language === "it" ? "Ultime attività" : "Recent tasks"}
            className={panelClass}
            action={{
              label: t(language, "dashboard.viewAll"),
              href: projectHref(project.id, "tasks"),
            }}
          >
            {loadingTasks ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it" ? "Caricamento..." : "Loading..."}
              </p>
            ) : recentTasks.length === 0 ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it" ? "Nessuna attività" : "No tasks yet"}
              </p>
            ) : (
              <div className="dashboard-panel-list flex w-full flex-col gap-1.5 overflow-y-auto lg:h-full">
                {recentTasks.map((task) => (
                  <OverviewTaskReminder
                    key={task.id}
                    task={task}
                    language={language}
                    toggling={togglingTaskId === task.id}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title={language === "it" ? "Ultimi file caricati" : "Latest uploads"}
            className={panelClass}
            action={{
              label: t(language, "dashboard.viewAll"),
              href: projectHref(project.id, "documents"),
            }}
          >
            {loadingDocuments ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it" ? "Caricamento..." : "Loading..."}
              </p>
            ) : recentDocuments.length === 0 ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it"
                  ? "Nessun file caricato"
                  : "No files uploaded yet"}
              </p>
            ) : (
              <div className="dashboard-panel-list flex w-full flex-col gap-2 overflow-y-auto lg:h-full">
                {recentDocuments.map((document) => (
                  <Card key={document.id} variant="nested" asChild>
                    <Link
                      href={projectHref(project.id, "documents")}
                      className={cn(
                        "flex items-center gap-3 p-3 sm:p-4",
                        transition.hover
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            textStyle.bodyMedium,
                            "truncate text-foreground"
                          )}
                        >
                          {document.name}
                        </p>
                        <p className={cn(textStyle.caption, "text-muted-foreground")}>
                          {getFileTypeLabel(document.file_type)} ·{" "}
                          {formatUploadDate(document.created_at)}
                        </p>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        <DocumentUploader
          projectId={project.id}
          inputId={UPLOADER_INPUT_ID}
          showDropzone={false}
          onUploadComplete={(document) => {
            setRecentDocuments((current) => {
              const next = [
                { ...document, tags: document.tags ?? [] },
                ...current.filter((item) => item.id !== document.id),
              ];
              return next.slice(0, RECENT_DOCUMENTS_LIMIT);
            });
            toast.success(
              language === "it"
                ? `${document.name} caricato`
                : `${document.name} uploaded`
            );
          }}
        />

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
