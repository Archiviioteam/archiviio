"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Project, ProjectStatus } from "@/types/database";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import {
  formatProjectCodeDisplay,
  formatProjectStatus,
  parseProjectCodeNumber,
} from "@/lib/projects";
import { deleteProject } from "@/lib/projects/project-actions";
import { createClient } from "@/lib/supabase/client";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { transition } from "@/lib/animation";
import { t } from "@/lib/i18n/translations";
import { useIsMobile } from "@/lib/layout/use-is-mobile";
import { useAppLanguage } from "@/lib/settings/language";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

const projectStatusFilterValues: ProjectStatus[] = [
  "active",
  "on_hold",
  "completed",
  "archived",
];

function getProjectStatusFilterLabel(
  status: ProjectStatus,
  language: "it" | "en"
): string {
  if (language === "it") {
    const labels: Record<ProjectStatus, string> = {
      active: "Solo attivi",
      on_hold: "Solo in pausa",
      completed: "Solo completati",
      archived: "Solo archiviati",
    };
    return labels[status];
  }

  return `${formatProjectStatus(status, language)} only`;
}

const statusSelectClassName = cn(
  "flex h-12 min-w-[9.5rem] cursor-pointer appearance-none border border-input bg-card px-3 py-2 pr-10 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  radius.control,
  textStyle.body,
  transition.hover
);

interface ProjectListProps {
  projects: Project[];
  onCreateClick: () => void;
  onProjectDeleted: (projectId: string) => void;
  onProjectStatusUpdated?: (projectId: string, status: Project["status"]) => void;
}

export function ProjectList({
  projects,
  onCreateClick,
  onProjectDeleted,
  onProjectStatusUpdated,
}: ProjectListProps) {
  const language = useAppLanguage();
  const isMobile = useIsMobile();
  const emptyStatePresets = getEmptyStatePresets(language);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const matches = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query) ||
        (project.location?.toLowerCase().includes(query) ?? false);
      const matchesStatus =
        statusFilter === null || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...matches].sort((a, b) => {
      const codeDiff =
        parseProjectCodeNumber(b.code) - parseProjectCodeNumber(a.code);
      if (codeDiff !== 0) {
        return sortOrder === "desc" ? codeDiff : -codeDiff;
      }

      const dateDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === "desc" ? dateDiff : -dateDiff;
    });
  }, [projects, search, sortOrder, statusFilter]);

  const hasActiveFilters = search.length > 0 || statusFilter !== null;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    const supabase = createClient();
    const result = await deleteProject(supabase, deleteTarget);

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      language === "it"
        ? `${deleteTarget.name} eliminato`
        : `${deleteTarget.name} deleted`
    );
    onProjectDeleted(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder={
              isMobile
                ? t(language, "search.trigger")
                : language === "it"
                  ? "Cerca per nome, codice o localita..."
                  : "Search by name, code, or location..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1"
          />
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <select
                value={statusFilter ?? ""}
                onChange={(event) =>
                  setStatusFilter(
                    (event.target.value as ProjectStatus) || null
                  )
                }
                className={cn(statusSelectClassName, "w-full sm:w-auto")}
                aria-label={
                  language === "it" ? "Filtra per stato" : "Filter by status"
                }
              >
                <option value="">
                  {language === "it" ? "Tutti gli stati" : "All statuses"}
                </option>
                {projectStatusFilterValues.map((status) => (
                  <option key={status} value={status}>
                    {getProjectStatusFilterLabel(status, language)}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={
                sortOrder === "desc"
                  ? language === "it"
                    ? "Dal piu recente al meno recente"
                    : "Newest to oldest"
                  : language === "it"
                    ? "Dal meno recente al piu recente"
                    : "Oldest to newest"
              }
              title={
                sortOrder === "desc"
                  ? language === "it"
                    ? "Dal piu recente al meno recente"
                    : "Newest to oldest"
                  : language === "it"
                    ? "Dal meno recente al piu recente"
                    : "Oldest to newest"
              }
              onClick={() =>
                setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
              }
            >
              {sortOrder === "desc" ? <ArrowUp /> : <ArrowDown />}
            </Button>
            <Button className="shrink-0" onClick={onCreateClick}>
              {language === "it" ? "Nuovo progetto" : "New project"}
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={
              hasActiveFilters
                ? emptyStatePresets.projectsSearch.icon
                : emptyStatePresets.projects.icon
            }
            title={hasActiveFilters ? emptyStatePresets.projectsSearch.title : undefined}
            action={
              hasActiveFilters
                ? {
                    label: emptyStatePresets.projectsSearch.actionLabel,
                    onClick: clearFilters,
                  }
                : {
                    label: emptyStatePresets.projects.actionLabel,
                    onClick: onCreateClick,
                  }
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={setDeleteTarget}
                deleteDisabled={deleting}
                onStatusUpdated={onProjectStatusUpdated}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "it" ? "Elimina progetto" : "Delete project"}
            </DialogTitle>
            <DialogDescription>
              {language === "it" ? "Eliminare" : "Delete"} {deleteTarget?.name} (
              {deleteTarget ? formatProjectCodeDisplay(deleteTarget.code) : ""}
              )?{" "}
              {language === "it"
                ? "Questa azione elimina il progetto e i dati collegati e non puo essere annullata."
                : "This removes the project and related data. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {language === "it" ? "Annulla" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting
                ? language === "it"
                  ? "Eliminazione..."
                  : "Deleting..."
                : language === "it"
                  ? "Elimina"
                  : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
