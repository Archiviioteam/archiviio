import type { TaskStatus, TaskUrgency } from "@/types/database";
import { getTaskUrgencyRank } from "@/lib/tasks/urgency";

interface TaskDueDateSortable {
  due_date: string | null;
  created_at: string;
  urgency: TaskUrgency | null;
  status?: TaskStatus;
}

function getTaskCompletionRank(status: TaskStatus | undefined): number {
  return status === "done" ? 1 : 0;
}

export function compareTasksByPriorityAndDueDate(
  a: TaskDueDateSortable,
  b: TaskDueDateSortable
): number {
  const completionCompare =
    getTaskCompletionRank(a.status) - getTaskCompletionRank(b.status);
  if (completionCompare !== 0) {
    return completionCompare;
  }

  const urgencyCompare =
    getTaskUrgencyRank(a.urgency) - getTaskUrgencyRank(b.urgency);
  if (urgencyCompare !== 0) {
    return urgencyCompare;
  }

  if (!a.due_date && !b.due_date) {
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  if (!a.due_date) {
    return 1;
  }

  if (!b.due_date) {
    return -1;
  }

  const dueCompare = a.due_date.localeCompare(b.due_date);
  if (dueCompare !== 0) {
    return dueCompare;
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function sortTasksByDueDate<T extends TaskDueDateSortable>(tasks: T[]): T[] {
  return [...tasks].sort(compareTasksByPriorityAndDueDate);
}
