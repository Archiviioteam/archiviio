"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/types/database";
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
  parseProjectCodeNumber,
} from "@/lib/projects";
import { deleteProject } from "@/lib/projects/project-actions";
import { createClient } from "@/lib/supabase/client";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";

interface ProjectListProps {
  projects: Project[];
  onCreateClick: () => void;
  onProjectDeleted: (projectId: string) => void;
}

export function ProjectList({
  projects,
  onCreateClick,
  onProjectDeleted,
}: ProjectListProps) {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const matches = projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query) ||
        (project.location?.toLowerCase().includes(query) ?? false)
      );
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
  }, [projects, search, sortOrder]);

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
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={
              language === "it"
                ? "Cerca per nome, codice o localita..."
                : "Search by name, code, or location..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1"
          />
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

        {filtered.length === 0 ? (
          <EmptyState
            icon={
              search
                ? emptyStatePresets.projectsSearch.icon
                : emptyStatePresets.projects.icon
            }
            title={search ? emptyStatePresets.projectsSearch.title : undefined}
            action={
              search
                ? {
                    label: emptyStatePresets.projectsSearch.actionLabel,
                    onClick: () => setSearch(""),
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
