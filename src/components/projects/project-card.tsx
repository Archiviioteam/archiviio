"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

interface ProjectCardContentProps {
  project: Project;
  className?: string;
  hideStatus?: boolean;
  layout?: "card" | "inline";
}

export function ProjectCardContent({
  project,
  className,
  hideStatus = false,
  layout = "card",
}: ProjectCardContentProps) {
  if (layout === "inline") {
    return (
      <span
        className={cn(
          textStyle.bodyMedium,
          "min-w-0 truncate text-foreground",
          className
        )}
      >
        {formatProjectCodeDisplay(project.code)}
        {" - "}
        {project.name}
      </span>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(textStyle.captionMedium, "shrink-0 text-foreground")}
        >
          {formatProjectCodeDisplay(project.code)}
        </span>
        {!hideStatus ? (
          <ProjectStatusBadge status={project.status} />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <span className={cn(textStyle.bodyMedium, "truncate text-foreground")}>
          {project.name}
        </span>
        {project.location ? (
          <span className={cn(textStyle.body, "truncate text-muted-foreground")}>
            {project.location}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  className?: string;
  onDelete?: (project: Project) => void;
  deleteDisabled?: boolean;
}

export function ProjectCard({
  project,
  className,
  onDelete,
  deleteDisabled = false,
}: ProjectCardProps) {
  return (
    <Card variant="interactive" className={className}>
      <CardContent className="flex items-center gap-2 p-4">
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
          <ProjectCardContent project={project} hideStatus={!!onDelete} />
        </Link>
        {onDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete project ${project.name}`}
              disabled={deleteDisabled}
              onClick={() => onDelete(project)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
