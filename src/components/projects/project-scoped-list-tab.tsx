"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Document, NomenclatureRule, Task } from "@/types/database";

type ScopedTabKind = "tasks" | "documents" | "nomenclature";

const taskStatusLabels: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

interface ProjectScopedListTabProps {
  projectId: string;
  kind: ScopedTabKind;
  title: string;
  emptyMessage: string;
}

export function ProjectScopedListTab({
  projectId,
  kind,
  title,
  emptyMessage,
}: ProjectScopedListTabProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [rules, setRules] = useState<NomenclatureRule[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setLoading(false);
        return;
      }

      if (kind === "tasks") {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        setTasks((data as Task[]) ?? []);
      } else if (kind === "documents") {
        const { data } = await supabase
          .from("documents")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        setDocuments((data as Document[]) ?? []);
      } else {
        const { data } = await supabase
          .from("nomenclature_rules")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        setRules((data as NomenclatureRule[]) ?? []);
      }

      setLoading(false);
    }

    load();
  }, [projectId, kind]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading {title}...</p>;
  }

  const count =
    kind === "tasks"
      ? tasks.length
      : kind === "documents"
        ? documents.length
        : rules.length;

  if (count === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <div className="flex flex-col gap-2">
        {kind === "tasks" &&
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between border border-border bg-card p-4"
            >
              <span className="text-sm font-medium text-foreground">
                {task.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {taskStatusLabels[task.status]}
              </span>
            </div>
          ))}

        {kind === "documents" &&
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between border border-border bg-card p-4"
            >
              <span className="text-sm font-medium text-foreground">
                {doc.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {doc.file_type ?? "File"}
              </span>
            </div>
          ))}

        {kind === "nomenclature" &&
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col gap-1 border border-border bg-card p-4"
            >
              <span className="text-sm font-medium text-foreground">
                {rule.pattern}
              </span>
              {rule.description ? (
                <span className="text-xs text-muted-foreground">
                  {rule.description}
                </span>
              ) : null}
            </div>
          ))}
      </div>
    </div>
  );
}
