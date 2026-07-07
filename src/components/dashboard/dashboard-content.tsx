"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FolderKanban, CheckSquare } from "lucide-react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { DashboardNotesComposer } from "@/components/dashboard/dashboard-notes-composer";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AddTaskDialog } from "@/components/projects/add-task-dialog";
import { UploadDocumentDialog } from "@/components/search/upload-document-dialog";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { readRecentlyOpenedProjects } from "@/lib/ai-command/last-opened-project-storage";
import {
  dashboardGridClassDesktop,
  dashboardGridClassMobile,
  dashboardGridGapClass,
  dashboardPanelClassDesktop,
  dashboardPanelClassMobile,
} from "@/lib/dashboard-layout";
import { deadlineHref, fetchDashboardData } from "@/lib/dashboard";
import { t } from "@/lib/i18n/translations";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import {
  getTaskUrgencyLabel,
  getTaskUrgencyPillClass,
  normalizeTaskUrgency,
} from "@/lib/tasks/urgency";
import { getWorkspaceId } from "@/lib/workspace";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard";
import type { Contact, Project, Supplier, Task } from "@/types/database";

function formatDueDate(value: string | null): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function DashboardContent() {
  const language = useAppLanguage();
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
            {data.projects.map((project) => (
              <Card key={project.id} variant="nested" asChild>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className={cn(textStyle.bodyMedium, "text-foreground")}>
                      {formatProjectCodeDisplay(project.code)} - {project.name}
                    </span>
                  </div>
                  <ProjectStatusBadge status={project.status} className="self-start shrink-0" />
                </Link>
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
            {data.deadlines.map((task) => (
              <Card key={task.id} variant="nested" asChild>
                <Link
                  href={deadlineHref(task)}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className={cn(textStyle.bodyMedium, "text-foreground")}>
                      {(task.projectCode
                        ? formatProjectCodeDisplay(task.projectCode)
                        : task.projectName ?? "—") +
                        " - " +
                        task.title}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
                    <span className={cn(textStyle.caption, "text-muted-foreground")}>
                      {formatDueDate(task.dueDate) || "—"}
                    </span>
                    {task.urgency ? (
                      <Badge
                        size="sm"
                        className={cn(
                          "text-black",
                          getTaskUrgencyPillClass(normalizeTaskUrgency(task.urgency))
                        )}
                      >
                        {getTaskUrgencyLabel(task.urgency, language)}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              </Card>
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
