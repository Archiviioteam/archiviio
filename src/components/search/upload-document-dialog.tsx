"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
import { DOCUMENT_ALLOWED_EXTENSIONS } from "@/lib/supabase/storage";
import { getWorkspaceId } from "@/lib/workspace";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

const UPLOAD_DIALOG_BODY_CLASS = "flex h-[var(--max-height-list)] flex-col";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreateProject?: () => void;
}

function hasDraggedFiles(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes("Files") ?? false;
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
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedProjectId(null);
      setDragOverProjectId(null);
      setIsDragging(false);
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

  const uploadFilesToProject = useCallback(
    async (projectId: string, fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setUploading(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        toast.error(t(language, "common.workspaceNotFound"));
        setUploading(false);
        return;
      }

      let lastUploadedName = files[0]?.name ?? "";
      let hadError = false;

      for (const file of files) {
        const result = await uploadDocument({
          supabase,
          workspaceId,
          projectId,
          file,
        });

        if (!result.ok) {
          toast.error(result.error);
          hadError = true;
          break;
        }

        lastUploadedName = file.name;
      }

      setUploading(false);
      setDragOverProjectId(null);
      setIsDragging(false);

      if (hadError) return;

      toast.success(
        t(language, "elaborati.uploadedToast").replace("{name}", lastUploadedName)
      );
      onOpenChange(false);
      router.push(projectHref(projectId, "documents"));
    },
    [language, onOpenChange, router]
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";

    if (!files || !selectedProjectId) {
      return;
    }

    await uploadFilesToProject(selectedProjectId, files);
  }

  function handleProjectSelect(projectId: string) {
    setSelectedProjectId(projectId);
    inputRef.current?.click();
  }

  function handleProjectDragEnter(
    event: React.DragEvent<HTMLButtonElement>,
    projectId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading && hasDraggedFiles(event.dataTransfer)) {
      setDragOverProjectId(projectId);
      setIsDragging(true);
    }
  }

  function handleProjectDragOver(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleProjectDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOverProjectId(null);
  }

  function handleProjectDrop(
    event: React.DragEvent<HTMLButtonElement>,
    projectId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverProjectId(null);
    setIsDragging(false);

    if (uploading) return;
    void uploadFilesToProject(projectId, event.dataTransfer.files);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={DOCUMENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
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
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                <Card
                  variant="dashed"
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 text-center",
                    isDragging && "border-primary bg-primary/10"
                  )}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    if (!uploading && hasDraggedFiles(event.dataTransfer)) {
                      setIsDragging(true);
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                    setIsDragging(false);
                  }}
                >
                  <div className={cn("flex size-9 items-center justify-center bg-muted", radius.pill)}>
                    <Upload className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isDragging
                      ? t(language, "documents.dropzoneActive")
                      : t(language, "elaborati.dropOnProject")}
                  </p>
                </Card>

                <div className="flex flex-col gap-2">
                  {projects.map((project) => (
                    <Card key={project.id} variant="nested" asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-2 p-3 text-left sm:gap-3 sm:p-4",
                          uploading && "pointer-events-none opacity-50",
                          dragOverProjectId === project.id &&
                            "border-primary bg-primary/10 ring-1 ring-primary/30"
                        )}
                        disabled={uploading}
                        onClick={() => handleProjectSelect(project.id)}
                        onDragEnter={(event) => handleProjectDragEnter(event, project.id)}
                        onDragOver={handleProjectDragOver}
                        onDragLeave={handleProjectDragLeave}
                        onDrop={(event) => handleProjectDrop(event, project.id)}
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
