"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { ProjectsSkeleton } from "@/components/loading/projects-skeleton";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectList } from "@/components/projects/project-list";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";
import { getWorkspaceId } from "@/lib/workspace";
import type { Project } from "@/types/database";

export function ProjectsContent() {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setCreateDialogOpen(true);
      router.replace("/projects");
    }
  }, [router, searchParams]);

  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((current) => [project, ...current]);
  }, []);

  if (loading) {
    return <ProjectsSkeleton />;
  }

  return (
    <>
      <PageLayout>
        <PageContent>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={emptyStatePresets.projects.icon}
                  action={{
                    label: emptyStatePresets.projects.actionLabel,
                    onClick: openCreateDialog,
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <ProjectList
              projects={projects}
              onCreateClick={openCreateDialog}
              onProjectDeleted={(projectId) =>
                setProjects((current) =>
                  current.filter((project) => project.id !== projectId)
                )
              }
            />
          )}
        </PageContent>
      </PageLayout>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
