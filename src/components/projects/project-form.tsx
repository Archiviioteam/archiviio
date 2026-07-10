"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectMemberPicker } from "@/components/projects/project-member-picker";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { generateProjectCode, formatProjectStatus, getProjectStatusPillClass } from "@/lib/projects";
import {
  fetchProjectMemberIds,
  fetchWorkspaceMembers,
  setProjectMembers,
} from "@/lib/projects/project-members";
import {
  buildProjectWritePayload,
  projectsHaveLocationColumn,
} from "@/lib/projects/schema";
import { getWorkspaceId } from "@/lib/workspace";
import { type MemberProfile } from "@/lib/users/member-display";
import { type Project, type ProjectStatus } from "@/types/database";
import { statusPillSelectorClass } from "@/lib/status-pills";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProjectFormProps {
  project?: Project;
  onSaved?: (project: Project) => void;
  onCancel?: () => void;
}

const statusValues: Extract<ProjectStatus, "active" | "on_hold" | "completed">[] =
  ["active", "on_hold", "completed"];

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const language = useAppLanguage();
  const router = useRouter();
  const isEditing = !!project;

  const [name, setName] = useState(project?.name ?? "");
  const [location, setLocation] = useState(project?.location ?? "");
  const [code, setCode] = useState(project?.code ?? "");
  const [useYearCode, setUseYearCode] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "active"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(!isEditing);
  const [locationSupported, setLocationSupported] = useState<boolean | null>(
    null
  );
  const [workspaceMembers, setWorkspaceMembers] = useState<MemberProfile[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      setMembersLoading(true);
      const supabase = createClient();
      const workspaceId = isEditing
        ? project.workspace_id
        : await getWorkspaceId(supabase);

      if (!workspaceId) {
        setWorkspaceMembers([]);
        setSelectedMemberIds([]);
        setMembersLoading(false);
        return;
      }

      const members = await fetchWorkspaceMembers(supabase, workspaceId);
      setWorkspaceMembers(members);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isEditing) {
        const memberIds = await fetchProjectMemberIds(supabase, project.id);
        setSelectedMemberIds(
          memberIds.length > 0 ? memberIds : user ? [user.id] : []
        );
      } else if (user && members.some((member) => member.id === user.id)) {
        setSelectedMemberIds([user.id]);
      } else if (members[0]) {
        setSelectedMemberIds([members[0].id]);
      } else {
        setSelectedMemberIds([]);
      }

      setMembersLoading(false);
    }

    void loadMembers();
  }, [isEditing, project?.id, project?.workspace_id]);

  useEffect(() => {
    async function checkLocationColumn() {
      const supabase = createClient();
      setLocationSupported(await projectsHaveLocationColumn(supabase));
    }

    void checkLocationColumn();
  }, []);

  useEffect(() => {
    if (isEditing) return;

    async function loadCode() {
      setCodeLoading(true);
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setCodeLoading(false);
        return;
      }

      const generated = await generateProjectCode(supabase, workspaceId, {
        useYear: useYearCode,
      });
      setCode(generated);
      setCodeLoading(false);
    }

    loadCode();
  }, [isEditing, useYearCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError(
        language === "it" ? "Il codice progetto è obbligatorio." : "Project code is required."
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const workspaceId = isEditing
      ? project.workspace_id
      : await getWorkspaceId(supabase);

    if (!workspaceId) {
      setError(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setLoading(false);
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError(
        language === "it"
          ? "Seleziona almeno un referente progetto."
          : "Select at least one project referent."
      );
      setLoading(false);
      return;
    }

    const payload = buildProjectWritePayload(
      {
        workspace_id: workspaceId,
        name,
        location: location.trim() || null,
        code: trimmedCode,
        status,
      },
      { includeLocation: locationSupported !== false }
    );

    if (isEditing) {
      const { data, error: updateError } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      void logActivity(supabase, {
        workspaceId,
        action: "project.updated",
        entityType: "project",
        entityId: project.id,
        projectId: project.id,
        title: trimmedCode,
        metadata: { project_name: name },
      });

      const membersResult = await setProjectMembers(
        supabase,
        workspaceId,
        project.id,
        selectedMemberIds
      );

      if (!membersResult.ok) {
        setError(membersResult.error);
        setLoading(false);
        return;
      }

      const updated = data as Project;
      onSaved?.(updated);
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert(payload)
      .select("*")
      .single();

    if (insertError || !data) {
      setError(
        insertError?.message ??
          (language === "it"
            ? "Creazione progetto non riuscita"
            : "Failed to create project")
      );
      setLoading(false);
      return;
    }

    void logActivity(supabase, {
      workspaceId,
      action: "project.created",
      entityType: "project",
      entityId: data.id,
      projectId: data.id,
      title: trimmedCode,
      metadata: { project_name: name },
    });

    const membersResult = await setProjectMembers(
      supabase,
      workspaceId,
      data.id,
      selectedMemberIds
    );

    if (!membersResult.ok) {
      setError(membersResult.error);
      setLoading(false);
      return;
    }

    const created = data as Project;

    if (onSaved) {
      onSaved(created);
    } else {
      router.push(`/projects/${created.id}`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{language === "it" ? "Nome progetto" : "Project name"}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            language === "it" ? "Ristrutturazione residenziale" : "Residential renovation"
          }
          required
        />
      </div>

      {locationSupported ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">{language === "it" ? "Località" : "Location"}</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Milano"
          />
        </div>
      ) : locationSupported === false ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {language === "it"
            ? "La località sarà disponibile dopo la migration 013 su Supabase."
            : "Location is unavailable until database migration 013 is applied in Supabase."}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">
          {language === "it" ? "Codice progetto" : "Project code"}
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={
            codeLoading
              ? language === "it"
                ? "Generazione..."
                : "Generating..."
              : language === "it"
                ? "es. rif#0001, PRJ-2026-A"
                : "e.g. rif#0001, PRJ-2026-A"
          }
          disabled={codeLoading}
          required
        />
        {!isEditing ? (
          <>
            <label
              className={cn(
                "flex items-center gap-2 text-muted-foreground",
                textStyle.body
              )}
            >
              <input
                type="checkbox"
                checked={useYearCode}
                onChange={(e) => setUseYearCode(e.target.checked)}
                className="size-4 border border-input"
              />
              {language === "it"
                ? `Usa anno corrente (rif#${new Date().getFullYear()})`
                : `Use current year (rif#${new Date().getFullYear()})`}
            </label>
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {language === "it"
                ? "Generato automaticamente in creazione. Puoi modificarlo liberamente."
                : "Auto-generated on create. You can change it to any value you prefer."}
            </p>
          </>
        ) : (
          <p className={cn(textStyle.caption, "text-muted-foreground")}>
            {language === "it"
              ? "Puoi usare qualsiasi formato codice."
              : "Use any code format you prefer."}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{language === "it" ? "Stato" : "Status"}</Label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={language === "it" ? "Stato" : "Status"}
        >
          {statusValues.map((value) => {
            const selected = status === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatus(value)}
                className={cn(
                  statusPillSelectorClass,
                  selected
                    ? cn(getProjectStatusPillClass(value), "text-black")
                    : "bg-muted text-muted-foreground"
                )}
              >
                {formatProjectStatus(value, language)}
              </button>
            );
          })}
        </div>
      </div>

      {!membersLoading && workspaceMembers.length > 0 ? (
        <ProjectMemberPicker
          members={workspaceMembers}
          selectedIds={selectedMemberIds}
          onChange={setSelectedMemberIds}
          disabled={loading}
        />
      ) : membersLoading ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {language === "it" ? "Caricamento team..." : "Loading team..."}
        </p>
      ) : null}

      {error && (
        <p className={cn(textStyle.body, "text-destructive")}>{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || codeLoading || membersLoading}>
          {loading
            ? language === "it"
              ? "Salvataggio..."
              : "Saving..."
            : isEditing
              ? language === "it"
                ? "Salva modifiche"
                : "Save changes"
              : language === "it"
                ? "Crea progetto"
                : "Create project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.back())}
        >
          {language === "it" ? "Annulla" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
