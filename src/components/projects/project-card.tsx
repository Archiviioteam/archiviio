"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { EditableProjectStatusBadge } from "@/components/projects/editable-project-status-badge";
import { MemberAvatarStack } from "@/components/users/member-avatar-stack";
import { formatProjectCodeDisplay } from "@/lib/projects";
import type { MemberProfile } from "@/lib/users/member-display";
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
  onStatusUpdated?: (status: Project["status"]) => void;
}

export function ProjectCardContent({
  project,
  className,
  hideStatus = false,
  layout = "card",
  onStatusUpdated,
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
          <EditableProjectStatusBadge
            projectId={project.id}
            status={project.status}
            onStatusUpdated={onStatusUpdated}
          />
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
  members?: MemberProfile[];
  className?: string;
  onDelete?: (project: Project) => void;
  deleteDisabled?: boolean;
  onStatusUpdated?: (projectId: string, status: Project["status"]) => void;
}

export function ProjectCard({
  project,
  members = [],
  className,
  onDelete,
  deleteDisabled = false,
  onStatusUpdated,
}: ProjectCardProps) {
  return (
    <Card variant="interactive" className={className}>
      <CardContent className="flex items-center gap-2 p-4">
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
          <ProjectCardContent project={project} hideStatus />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {members.length > 0 ? (
            <MemberAvatarStack
              members={members}
              size="xxs"
              separated
              maxVisible={5}
            />
          ) : null}
          <EditableProjectStatusBadge
            projectId={project.id}
            status={project.status}
            onStatusUpdated={(status) => onStatusUpdated?.(project.id, status)}
          />
          {onDelete ? (
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
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
