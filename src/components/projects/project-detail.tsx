"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { recordLastOpenedProject } from "@/lib/ai-command/last-opened-project-storage";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { textStyle } from "@/lib/typography";
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab";
import { ProjectContactsTab } from "@/components/projects/project-contacts-tab";
import { ProjectSuppliersTab } from "@/components/projects/project-suppliers-tab";
import { ProjectDocumentsTab } from "@/components/projects/project-documents-tab";
import { ProjectTasksTab } from "@/components/projects/project-tasks-tab";
import {
  PROJECT_TABS,
  ProjectTabs,
  type ProjectTabId,
} from "@/components/projects/project-tabs";
import { usePageTitleOverride } from "@/components/layout/layout-provider";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/database";
import { cn } from "@/lib/utils";

function parseProjectTab(value: string | null): ProjectTabId {
  const validTabs = new Set(PROJECT_TABS.map((tab) => tab.id));
  if (value && validTabs.has(value as ProjectTabId)) {
    return value as ProjectTabId;
  }

  return "overview";
}

export function ProjectDetail() {
  const language = useAppLanguage();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTabId>(() =>
    parseProjectTab(searchParams.get("tab"))
  );

  useEffect(() => {
    setActiveTab(parseProjectTab(searchParams.get("tab")));
  }, [searchParams]);

  usePageTitleOverride(
    project
      ? `${formatProjectCodeDisplay(project.code)} - ${project.name}`
      : null
  );

  useEffect(() => {
    async function loadProject() {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .eq("workspace_id", workspaceId ?? "")
        .single();

      if (!data) {
        setNotFound(true);
      } else {
        const loaded = data as Project;
        setProject(loaded);
        if (workspaceId) {
          recordLastOpenedProject(workspaceId, loaded);
        }
      }
      setLoading(false);
    }

    loadProject();
  }, [params.id]);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {language === "it" ? "Caricamento progetto..." : "Loading project..."}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  if (notFound || !project) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {language === "it" ? "Progetto non trovato." : "Project not found."}
          </p>
          <Button variant="outline" asChild>
            <Link href="/projects">
              {language === "it" ? "Torna ai progetti" : "Back to projects"}
            </Link>
          </Button>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div>
        {activeTab === "overview" && (
          <ProjectOverviewTab
            project={project}
            onProjectUpdated={setProject}
          />
        )}
        {activeTab === "tasks" && <ProjectTasksTab projectId={project.id} />}
        {activeTab === "documents" && (
          <ProjectDocumentsTab projectId={project.id} />
        )}
        {activeTab === "contacts" && (
          <ProjectContactsTab projectId={project.id} />
        )}
        {activeTab === "suppliers" && (
          <ProjectSuppliersTab
            projectId={project.id}
            projectName={project.name}
            projectCode={project.code}
          />
        )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
