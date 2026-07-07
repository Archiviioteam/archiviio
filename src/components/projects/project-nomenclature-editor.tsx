"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";
import type { ProjectNomenclature } from "@/types/database";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ProjectNomenclatureEditorProps {
  projectId: string;
  projectCode: string;
}

export function ProjectNomenclatureEditor({
  projectId,
  projectCode,
}: ProjectNomenclatureEditorProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const workspaceIdRef = useRef<string | null>(null);
  const recordIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        if (!cancelled) {
          setError("Workspace not found");
          setLoading(false);
        }
        return;
      }

      workspaceIdRef.current = workspaceId;

      const { data, error: loadError } = await supabase
        .from("project_nomenclatures")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .maybeSingle();

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const record = data as ProjectNomenclature | null;
      const initialContent = record?.content ?? "";
      recordIdRef.current = record?.id ?? null;
      setContent(initialContent);
      setSavedContent(initialContent);
      setLoading(false);
    }

    setLoading(true);
    setError(null);
    setSaveStatus("idle");
    load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persist = useCallback(async (nextContent: string) => {
    const workspaceId = workspaceIdRef.current;
    if (!workspaceId) return;

    setSaveStatus("saving");
    setError(null);

    const supabase = createClient();
    const payload = {
      workspace_id: workspaceId,
      project_id: projectId,
      content: nextContent,
    };

    const { data, error: saveError } = recordIdRef.current
      ? await supabase
          .from("project_nomenclatures")
          .update({ content: nextContent })
          .eq("id", recordIdRef.current)
          .eq("workspace_id", workspaceId)
          .select("id, content")
          .single()
      : await supabase
          .from("project_nomenclatures")
          .insert(payload)
          .select("id, content")
          .single();

    if (saveError) {
      setSaveStatus("error");
      setError(saveError.message);
      return;
    }

    recordIdRef.current = data.id;
    setSavedContent(data.content);
    setSaveStatus("saved");

    void logActivity(supabase, {
      workspaceId,
      action: "nomenclature.updated",
      entityType: "nomenclature",
      entityId: data.id,
      projectId,
      title: projectCode,
    });
  }, [projectId, projectCode]);

  useEffect(() => {
    if (loading || content === savedContent) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void persist(content);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, savedContent, loading, persist]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading nomenclature...</p>
    );
  }

  const statusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "All changes saved"
        : saveStatus === "error"
          ? "Save failed"
          : content !== savedContent
            ? "Unsaved changes"
            : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nomenclature</CardTitle>
        <CardDescription>
          Define naming conventions and file rules for this project. Changes save
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (saveStatus === "saved" || saveStatus === "error") {
            setSaveStatus("idle");
          }
        }}
        placeholder="Example:&#10;Drawings → rif#0001-DRW-{discipline}-{number}&#10;Reports → rif#0001-RPT-{type}-{date}"
        className={cn(
          "min-h-editor w-full resize-y border border-input bg-card px-3 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          radius.control
        )}
        spellCheck={false}
      />

      <div className="flex items-center justify-between gap-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <span />
        )}
        {statusLabel ? (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              saveStatus === "error" && "text-destructive"
            )}
          >
            {statusLabel}
          </p>
        ) : null}
      </div>
      </CardContent>
    </Card>
  );
}
