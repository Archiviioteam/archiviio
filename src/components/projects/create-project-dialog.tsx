"use client";

import { ProjectForm } from "@/components/projects/project-form";
import { useAppLanguage } from "@/lib/settings/language";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types/database";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const language = useAppLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === "it" ? "Crea progetto" : "Create project"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
          <ProjectForm
            key="create-project-form"
            onSaved={(project) => {
              onProjectCreated?.(project);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
