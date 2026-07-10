"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import {
  AddTaskDialog,
} from "@/components/projects/add-task-dialog";
import { TaskCard } from "@/components/projects/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";
import {
  fetchWorkspaceTasks,
  formatTaskProjectLabel,
  type WorkspaceTask,
} from "@/lib/tasks/fetch-workspace-tasks";
import { sortTasksByDueDate } from "@/lib/tasks/sort-tasks-by-due-date";
import { toggleTaskCompletion } from "@/lib/tasks/toggle-task-completion";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Task } from "@/types/database";

export function TasksContent() {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const data = await fetchWorkspaceTasks(supabase, workspaceId);
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTask(null);
      setEditingProjectId(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingTask(null);
    setEditingProjectId(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task: Task) => {
    if (!task.project_id) {
      toast.error(
        language === "it"
          ? "Questa attività non è collegata a un progetto."
          : "This task is not linked to a project."
      );
      return;
    }

    setEditingTask(task);
    setEditingProjectId(task.project_id);
    setDialogOpen(true);
  }, []);

  const handleTaskSaved = useCallback(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((current) => current.filter((item) => item.id !== taskId));
  }, []);

  const handleToggleComplete = useCallback(async (task: Task, completed: boolean) => {
    if (!task.project_id) {
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
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setTogglingTaskId(null);
      return;
    }

    const result = await toggleTaskCompletion({
      supabase,
      workspaceId,
      taskId: task.id,
      projectId: task.project_id,
      title: task.title,
      completed,
    });

    setTogglingTaskId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    handleTaskSaved();
  }, [handleTaskSaved, language]);

  const filteredTasks = sortTasksByDueDate(
    tasks.filter((task) => {
      const query = search.toLowerCase();
      const projectLabel = formatTaskProjectLabel(task)?.toLowerCase() ?? "";

      return (
        task.title.toLowerCase().includes(query) ||
        (task.notes?.toLowerCase().includes(query) ?? false) ||
        projectLabel.includes(query)
      );
    })
  );

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className="text-sm text-muted-foreground">
            {language === "it" ? "Caricamento attività..." : "Loading tasks..."}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={emptyStatePresets.tasks.icon}
                title={emptyStatePresets.tasks.title}
                action={{
                  label: language === "it" ? "Aggiungi attività" : "Add task",
                  onClick: openCreateDialog,
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <SearchInput
                placeholder={
                  language === "it"
                    ? "Cerca per titolo, note o progetto..."
                    : "Search by title, notes, or project..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                className="shrink-0"
                onClick={openCreateDialog}
              >
                {language === "it" ? "Aggiungi attività" : "Add task"}
              </Button>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={emptyStatePresets.tasksSearch.icon}
                title={emptyStatePresets.tasksSearch.title}
                action={{
                  label: emptyStatePresets.tasksSearch.actionLabel,
                  onClick: () => setSearch(""),
                }}
              />
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectLabel={formatTaskProjectLabel(task)}
                  assignee={task.assignee}
                  onClick={openEditDialog}
                  onToggleComplete={handleToggleComplete}
                  onUrgencyUpdated={() => handleTaskSaved()}
                  toggling={togglingTaskId === task.id}
                />
              ))
            )}
          </div>
        )}
      </PageContent>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        projectId={editingProjectId ?? undefined}
        allowProjectSelection={!editingTask}
        task={editingTask}
        onTaskSaved={() => handleTaskSaved()}
        onTaskDeleted={handleTaskDeleted}
      />
    </PageLayout>
  );
}
