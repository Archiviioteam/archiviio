"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListItemSkeleton } from "@/components/loading/list-item-skeleton";
import { ProjectCardContent } from "@/components/projects/project-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { sortProjectsByCodeDescending } from "@/lib/projects";
import { uploadDocument } from "@/lib/documents/upload-document";
import { projectHref } from "@/lib/search/search-routes";
import { createClient } from "@/lib/supabase/client";
import { projectListSelectColumns } from "@/lib/projects/schema";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

const UPLOAD_DIALOG_BODY_CLASS = "flex h-[var(--max-height-list)] flex-col";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreateProject?: () => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onRequestCreateProject,
}: UploadDocumentDialogProps) {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedProjectId(null);
      return;
    }

    async function loadProjects() {
      setLoading(true);
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const columns = await projectListSelectColumns(supabase);
      const { data } = await supabase
        .from("projects")
        .select(columns)
        .eq("workspace_id", workspaceId);

      setProjects(
        sortProjectsByCodeDescending((data as unknown as Project[]) ?? [])
      );
      setLoading(false);
    }

    void loadProjects();
  }, [open]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedProjectId) {
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(t(language, "common.workspaceNotFound"));
      setUploading(false);
      return;
    }

    const result = await uploadDocument({
      supabase,
      workspaceId,
      projectId: selectedProjectId,
      file,
    });

    setUploading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      t(language, "elaborati.uploadedToast").replace("{name}", file.name)
    );
    onOpenChange(false);
    router.push(projectHref(selectedProjectId, "documents"));
  }

  function handleProjectSelect(projectId: string) {
    setSelectedProjectId(projectId);
    inputRef.current?.click();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(language, "elaborati.uploadTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "elaborati.uploadDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className={UPLOAD_DIALOG_BODY_CLASS}>
            {loading ? (
              <div className="flex flex-col gap-1 overflow-hidden">
                {Array.from({ length: 4 }, (_, index) => (
                  <ListItemSkeleton key={index} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  compact
                  icon={emptyStatePresets.uploadNoProjects.icon}
                  title={emptyStatePresets.uploadNoProjects.title}
                  action={{
                    label: emptyStatePresets.uploadNoProjects.actionLabel,
                    onClick: () => {
                      onOpenChange(false);
                      if (onRequestCreateProject) {
                        onRequestCreateProject();
                        return;
                      }
                      router.push("/projects?action=create");
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {projects.map((project) => (
                  <Card key={project.id} variant="nested" asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 p-3 text-left sm:gap-3 sm:p-4",
                        uploading && "pointer-events-none opacity-50"
                      )}
                      disabled={uploading}
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <ProjectCardContent
                        project={project}
                        layout="inline"
                        className="w-full"
                      />
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
