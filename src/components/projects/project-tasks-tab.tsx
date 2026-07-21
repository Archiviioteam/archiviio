"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sortTasksByDueDate } from "@/lib/tasks/sort-tasks-by-due-date";
import { toggleTaskCompletion } from "@/lib/tasks/toggle-task-completion";
import { useAppLanguage } from "@/lib/settings/language";
import { getWorkspaceId } from "@/lib/workspace";
import { AddTaskDialog } from "@/components/projects/add-task-dialog";
import { TaskCard } from "@/components/projects/task-card";
import { CompletedTasksSection } from "@/components/tasks/completed-tasks-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Task } from "@/types/database";

interface AddTaskContainerProps {
  centered?: boolean;
  onAddClick: () => void;
}

function AddTaskContainer({ centered = false, onAddClick }: AddTaskContainerProps) {
  const language = useAppLanguage();
  if (centered) {
    return (
      <EmptyState
        action={{
          label: language === "it" ? "Aggiungi attività" : "Add task",
          onClick: onAddClick,
        }}
      />
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-center p-4">
        <Button type="button" onClick={onAddClick}>
          {language === "it" ? "Aggiungi attività" : "Add task"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("project_id", projectId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    setTasks(sortTasksByDueDate((data as Task[]) ?? []));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleTaskSaved = useCallback(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((current) => current.filter((item) => item.id !== taskId));
  }, []);

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
        projectId,
        title: task.title,
        completed,
      });

      setTogglingTaskId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      handleTaskSaved();
    },
    [handleTaskSaved, language, projectId]
  );

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {language === "it" ? "Caricamento attività..." : "Loading tasks..."}
      </p>
    );
  }

  const activeTasks = tasks.filter((task) => task.status !== "done");
  const completedTasks = tasks.filter((task) => task.status === "done");

  return (
    <>
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <AddTaskContainer centered onAddClick={openCreateDialog} />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <AddTaskContainer onAddClick={openCreateDialog} />
          {activeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={openEditDialog}
              onToggleComplete={handleToggleComplete}
              onUrgencyUpdated={() => handleTaskSaved()}
              toggling={togglingTaskId === task.id}
            />
          ))}
          <CompletedTasksSection count={completedTasks.length}>
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={openEditDialog}
                onToggleComplete={handleToggleComplete}
                onUrgencyUpdated={() => handleTaskSaved()}
                toggling={togglingTaskId === task.id}
              />
            ))}
          </CompletedTasksSection>
        </div>
      )}

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        projectId={projectId}
        task={editingTask}
        onTaskSaved={() => handleTaskSaved()}
        onTaskDeleted={handleTaskDeleted}
      />
    </>
  );
}
