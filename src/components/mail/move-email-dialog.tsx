"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/http/fetch-api";
import { readJsonResponse } from "@/lib/http/read-json-response";
import { formatProjectCodeDisplay } from "@/lib/projects";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { ArchivedEmail, Project } from "@/types/database";

interface MoveEmailDialogProps {
  email: ArchivedEmail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved: (email: ArchivedEmail) => void;
}

export function MoveEmailDialog({
  email,
  open,
  onOpenChange,
  onMoved,
}: MoveEmailDialogProps) {
  const language = useAppLanguage();
  const it = language === "it";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);
      if (!workspaceId || cancelled) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => {
      const label = `${formatProjectCodeDisplay(project.code)} ${project.name} ${project.location ?? ""}`;
      return label.toLowerCase().includes(query);
    });
  }, [projects, search]);

  const handleMove = useCallback(async () => {
    if (!email || !selectedProjectId) return;
    setSaving(true);
    try {
      const response = await fetchApi(`/api/archived-emails/${email.id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });
      const payload = await readJsonResponse<{
        error?: string;
        email?: ArchivedEmail;
      }>(response);
      if (!response.ok || !payload.email) {
        throw new Error(payload.error ?? "Move failed");
      }
      onMoved(payload.email);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : it
            ? "Spostamento fallito"
            : "Move failed"
      );
    } finally {
      setSaving(false);
    }
  }, [email, it, onMoved, onOpenChange, selectedProjectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{it ? "Sposta in progetto" : "Move to project"}</DialogTitle>
          <DialogDescription>
            {email?.subject || (it ? "Seleziona il progetto di destinazione." : "Choose a destination project.")}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={it ? "Cerca progetto..." : "Search project..."}
        />

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {it ? "Caricamento progetti..." : "Loading projects..."}
            </div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {it ? "Nessun progetto trovato." : "No projects found."}
            </p>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedProjectId === project.id
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                {formatProjectCodeDisplay(project.code)} - {project.name}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleMove()}
            disabled={!selectedProjectId || saving}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            {it ? "Sposta" : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
