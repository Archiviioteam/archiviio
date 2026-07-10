"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckSquare, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { DashboardNotesComposer } from "@/components/dashboard/dashboard-notes-composer";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AddTaskDialog } from "@/components/projects/add-task-dialog";
import { UploadDocumentDialog } from "@/components/search/upload-document-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EditableProjectStatusBadge } from "@/components/projects/editable-project-status-badge";
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import { EditableTaskUrgencyBadge } from "@/components/tasks/editable-task-urgency-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { readRecentlyOpenedProjects } from "@/lib/ai-command/last-opened-project-storage";
import { transition } from "@/lib/animation";
import {
  dashboardGridClassDesktop,
  dashboardGridClassMobile,
  dashboardGridGapClass,
  dashboardPanelClassDesktop,
  dashboardPanelClassMobile,
} from "@/lib/dashboard-layout";
import {
  deadlineHref,
  fetchDashboardData,
  formatDashboardTaskLabel,
} from "@/lib/dashboard";
import { t } from "@/lib/i18n/translations";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { radius } from "@/lib/theme";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/lib/layout/use-is-mobile";
import {
  getTaskUrgencyLabel,
  getTaskUrgencyPillClass,
  normalizeTaskUrgency,
} from "@/lib/tasks/urgency";
import { toggleTaskCompletion } from "@/lib/tasks/toggle-task-completion";
import { getWorkspaceId } from "@/lib/workspace";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { DashboardData, DashboardDeadline } from "@/lib/dashboard";
import type { Contact, Project, Supplier, Task } from "@/types/database";

import { formatDate } from "@/lib/date-format";

function formatDueDate(value: string | null): string {
  if (!value) return "";
  return formatDate(value);
}

interface DashboardTaskRowProps {
  task: DashboardDeadline;
  toggling: boolean;
  onToggleComplete: (task: DashboardDeadline) => void;
  onUrgencyUpdated: (taskId: string, urgency: DashboardDeadline["urgency"]) => void;
}

function DashboardTaskRow({
  task,
  toggling,
  onToggleComplete,
  onUrgencyUpdated,
}: DashboardTaskRowProps) {
  const language = useAppLanguage();

  return (
    <Card variant="nested">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={false}
          aria-label={t(language, "tasks.markComplete")}
          disabled={toggling}
          onClick={() => onToggleComplete(task)}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center border-2 border-input bg-card",
            radius.control,
            transition.hover,
            toggling && "opacity-50"
          )}
        />
        <Link
          href={deadlineHref(task)}
          className={cn(
            textStyle.bodyMedium,
            "min-w-0 flex-1 truncate text-left text-foreground"
          )}
        >
          {formatDashboardTaskLabel(task)}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn(textStyle.caption, "whitespace-nowrap text-muted-foreground")}>
            {formatDueDate(task.dueDate) || "—"}
          </span>
          {task.projectId ? (
            <div className="shrink-0">
              <EditableTaskUrgencyBadge
                taskId={task.id}
                projectId={task.projectId}
                title={task.title}
                urgency={task.urgency}
                onUrgencyUpdated={(urgency) => onUrgencyUpdated(task.id, urgency)}
              />
            </div>
          ) : task.urgency ? (
            <StatusPillBadge
              label={getTaskUrgencyLabel(task.urgency, language)}
              pillClass={getTaskUrgencyPillClass(normalizeTaskUrgency(task.urgency))}
            />
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function DashboardContent() {
  const language = useAppLanguage();
  const isMobile = useIsMobile();
  const [data, setData] = useState<DashboardData>({
    projects: [],
    deadlines: [],
    activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setData({ projects: [], deadlines: [], activity: [] });
      setLoading(false);
      return;
    }

    const recentlyOpened = readRecentlyOpenedProjects(workspaceId);
    const dashboardData = await fetchDashboardData(supabase, workspaceId, {
      recentlyOpened,
    });

    setData(dashboardData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleQuickActionClick = useCallback((actionId: string) => {
    if (actionId === "new-project") {
      setProjectDialogOpen(true);
      return;
    }
    if (actionId === "new-contact") {
      setContactDialogOpen(true);
      return;
    }
    if (actionId === "new-supplier") {
      setSupplierDialogOpen(true);
      return;
    }
    if (actionId === "upload-document") {
      setUploadDialogOpen(true);
    }
  }, []);

  const handleToggleComplete = useCallback(
    async (task: DashboardDeadline) => {
      if (!task.projectId) {
        toast.error(
          language === "it"
            ? "Questa attività non è collegata a un progetto."
            : "This task is not linked to a project."
        );
        return;
      }

      setTogglingTaskId(task.id);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(
          language === "it" ? "Workspace non trovato" : "Workspace not found"
        );
        setTogglingTaskId(null);
        return;
      }

      const result = await toggleTaskCompletion({
        supabase,
        workspaceId,
        taskId: task.id,
        projectId: task.projectId,
        title: task.title,
        completed: true,
      });

      setTogglingTaskId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        deadlines: current.deadlines.filter((item) => item.id !== task.id),
      }));
    },
    [language]
  );

  const handleDeadlineUrgencyUpdated = useCallback(
    (taskId: string, urgency: DashboardDeadline["urgency"]) => {
      setData((current) => ({
        ...current,
        deadlines: current.deadlines.map((deadline) =>
          deadline.id === taskId ? { ...deadline, urgency } : deadline
        ),
      }));
    },
    []
  );

  const handleProjectStatusUpdated = useCallback(
    (projectId: string, status: Project["status"]) => {
      setData((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, status } : project
        ),
      }));
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-projects-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          void loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          void loadDashboard();
        }
      )
      .subscribe();

    const onFocus = () => {
      void loadDashboard();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const panelClass = cn(
    dashboardPanelClassMobile,
    dashboardPanelClassDesktop
  );
  const visibleProjects = isMobile ? data.projects.slice(0, 2) : data.projects;
  const visibleDeadlines = isMobile ? data.deadlines.slice(0, 2) : data.deadlines;

  return (
    <div
      data-dashboard-grid
      className={cn(
        dashboardGridClassMobile,
        dashboardGridClassDesktop,
        dashboardGridGapClass
      )}
    >
      <DashboardSection
        title={t(language, "dashboard.recentProjects")}
        className={panelClass}
        action={{ label: t(language, "dashboard.viewAll"), href: "/projects" }}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">{t(language, "common.loading")}</p>
        ) : data.projects.length === 0 ? (
          <EmptyState
            compact
            fill
            icon={FolderKanban}
            action={{ label: t(language, "quickActions.createProject"), href: "/projects?action=create" }}
          />
        ) : (
          <div className="dashboard-panel-list flex w-full flex-col gap-2 overflow-y-auto lg:h-full">
            {visibleProjects.map((project) => (
              <Card key={project.id} variant="nested">
                <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                  <Link
                    href={`/projects/${project.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className={cn(textStyle.bodyMedium, "text-foreground")}>
                      {formatProjectCodeDisplay(project.code)} - {project.name}
                    </span>
                  </Link>
                  <EditableProjectStatusBadge
                    projectId={project.id}
                    status={project.status}
                    className="self-start shrink-0"
                    onStatusUpdated={(status) =>
                      handleProjectStatusUpdated(project.id, status)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title={t(language, "dashboard.upcomingTasks")}
        className={panelClass}
        action={{ label: t(language, "tasks.addTask"), onClick: () => setTaskDialogOpen(true) }}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">{t(language, "common.loading")}</p>
        ) : data.deadlines.length === 0 ? (
          <EmptyState
            compact
            fill
            icon={CheckSquare}
            action={{ label: t(language, "tasks.viewTasks"), href: "/tasks" }}
          />
        ) : (
          <div className="dashboard-panel-list flex w-full flex-col gap-2 overflow-y-auto lg:h-full">
            {visibleDeadlines.map((task) => (
              <DashboardTaskRow
                key={task.id}
                task={task}
                toggling={togglingTaskId === task.id}
                onToggleComplete={(deadline) => void handleToggleComplete(deadline)}
                onUrgencyUpdated={handleDeadlineUrgencyUpdated}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title={t(language, "dashboard.note")}
        className={panelClass}
        action={{ label: t(language, "dashboard.viewAll"), href: "/notes" }}
        contentClassName="flex min-h-0 flex-1 flex-col items-center justify-start pt-2 sm:pt-3"
      >
        <DashboardNotesComposer />
      </DashboardSection>

      <DashboardSection title={t(language, "dashboard.quickActions")} className={panelClass}>
        <DashboardQuickActions onActionClick={handleQuickActionClick} />
      </DashboardSection>

      <CreateProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onProjectCreated={(_project: Project) => {
          void loadDashboard();
        }}
      />

      <AddContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onContactSaved={(_contact: Contact) => {
          setContactDialogOpen(false);
        }}
      />

      <AddSupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onSupplierSaved={(_supplier: Supplier) => {
          setSupplierDialogOpen(false);
        }}
      />

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onRequestCreateProject={() => {
          setUploadDialogOpen(false);
          setProjectDialogOpen(true);
        }}
      />

      <AddTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        allowProjectSelection
        onTaskSaved={(_task: Task) => {
          setTaskDialogOpen(false);
          void loadDashboard();
        }}
      />
    </div>
  );
}
