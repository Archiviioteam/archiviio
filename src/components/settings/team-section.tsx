"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { removeWorkspaceMember } from "@/lib/settings/remove-workspace-member";
import { updateWorkspaceMemberRole } from "@/lib/settings/update-workspace-member-role";
import { TEAM_FEATURES_ENABLED } from "@/lib/settings/constants";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { splitFullName } from "@/lib/settings/validation";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { InviteTeamMemberForm } from "@/components/settings/invite-team-member-form";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import type { MemberRole, User } from "@/types/database";

function memberName(member: User): string {
  const first = member.first_name?.trim();
  const last = member.last_name?.trim();

  if (first || last) {
    return [first, last].filter(Boolean).join(" ");
  }

  if (member.full_name?.trim()) {
    return member.full_name.trim();
  }

  return member.email;
}

function memberInitials(member: User): string {
  const name = memberName(member);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`;
  }

  return name.slice(0, 2);
}

function roleLabel(role: MemberRole, language: "it" | "en"): string {
  return role === "owner"
    ? t(language, "team.roleOwner")
    : t(language, "team.roleMember");
}

export function TeamSection() {
  const language = useAppLanguage();
  const [members, setMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Array<{ id: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removing, setRemoving] = useState(false);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [roleChoice, setRoleChoice] = useState<MemberRole | "other">("member");
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled && user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("users")
          .select("workspace_id")
          .eq("id", user.id)
          .single();

        const workspaceId = profile?.workspace_id as string | null;
        if (workspaceId) {
          const { data: invited, error: invitedError } = await supabase
            .from("workspace_invitations")
            .select("id,email,status")
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (!cancelled) {
            if (invitedError) {
              toast.error(invitedError.message);
            } else {
              setInvitations(
                (invited ?? []).map((invitation) => ({
                  id: String(invitation.id),
                  email: String(invitation.email ?? ""),
                }))
              );
            }
          }
        }
      }

      if (!cancelled) {
        setLoadingInvitations(false);
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setMembers((data as User[]) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemoveMember() {
    if (!removeTarget) {
      return;
    }

    setRemoving(true);
    const result = await removeWorkspaceMember(removeTarget.id);
    setRemoving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setMembers((current) => current.filter((member) => member.id !== removeTarget.id));
    toast.success(
      language === "it"
        ? "Utente rimosso dallo spazio di lavoro"
        : "Member removed from workspace"
    );
    setRemoveTarget(null);
  }

  async function handleUpdateRole() {
    if (!roleTarget) {
      return;
    }

    if (roleChoice === "other") {
      toast.error(
        language === "it"
          ? "Il ruolo Altro non è ancora disponibile"
          : "The Other role is not available yet"
      );
      return;
    }

    if (roleChoice === roleTarget.role) {
      setRoleTarget(null);
      return;
    }

    setUpdatingRole(true);
    const result = await updateWorkspaceMemberRole(roleTarget.id, roleChoice);
    setUpdatingRole(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setMembers((current) =>
      current.map((member) =>
        member.id === roleTarget.id ? { ...member, role: roleChoice } : member
      )
    );
    toast.success(
      language === "it" ? "Ruolo aggiornato" : "Role updated"
    );
    setRoleTarget(null);
  }

  const showEmptyState = !TEAM_FEATURES_ENABLED;

  return (
    <SettingsSectionCard
      title={t(language, "team.membersTitle")}
      description={t(language, "team.membersDescription")}
    >
      <InviteTeamMemberForm
        onInvited={(email) => {
          setInvitations((current) =>
            current.some((invitation) => invitation.email === email)
              ? current
              : [{ id: `temp-${email}`, email }, ...current]
          );
        }}
      />

      {loadingInvitations ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {t(language, "team.loading")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className={cn(textStyle.captionMedium, "text-muted-foreground")}>
            {t(language, "workspace.invitedCollaborators")}
          </p>
          {invitations.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className={cn(
                    textStyle.bodyMedium,
                    "rounded-control border border-border/60 bg-muted/20 px-3 py-2"
                  )}
                >
                  {invitation.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn(textStyle.caption, "text-muted-foreground")}>
              {t(language, "workspace.noInvites")}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p className={cn(textStyle.body, "text-muted-foreground")}>
          {t(language, "team.loading")}
        </p>
      ) : showEmptyState ? (
        <EmptyState
          icon={Users}
          title={t(language, "team.notActiveTitle")}
          description={t(language, "team.notActiveDescription")}
          className="py-10"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {members.map((member) => {
            const names = splitFullName(member.full_name);
            const displayName = memberName({
              ...member,
              first_name: member.first_name ?? names.firstName,
              last_name: member.last_name ?? names.lastName,
            });
            const canRemove = member.id !== currentUserId && member.role !== "owner";
            const canEditRole = member.id !== currentUserId;

            return (
              <li
                key={member.id}
                className="flex items-center gap-4 rounded-nested border border-border/60 bg-muted/20 px-4 py-3"
              >
                <Avatar fallback={memberInitials(member)} size="md" />
                <div className="min-w-0 flex-1">
                  <p className={cn(textStyle.bodyMedium, "truncate")}>
                    {displayName}
                  </p>
                  <p
                    className={cn(
                      textStyle.caption,
                      "truncate text-muted-foreground"
                    )}
                  >
                    {member.email}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-sm"
                  onClick={() => {
                    if (!canEditRole) {
                      return;
                    }
                    setRoleChoice(member.role);
                    setRoleTarget(member);
                  }}
                >
                  <Badge variant="secondary">{roleLabel(member.role, language)}</Badge>
                </button>
                {canRemove ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRemoveTarget(member)}
                  >
                    {language === "it" ? "Elimina" : "Remove"}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !removing) {
            setRemoveTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "it"
                ? "Rimuovi utente dallo spazio"
                : "Remove member from workspace"}
            </DialogTitle>
            <DialogDescription>
              {language === "it"
                ? `Vuoi rimuovere ${removeTarget?.email ?? "questo utente"} dallo spazio di lavoro?`
                : `Do you want to remove ${removeTarget?.email ?? "this member"} from the workspace?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button onClick={() => void handleRemoveMember()} disabled={removing}>
              {removing
                ? language === "it"
                  ? "Rimozione..."
                  : "Removing..."
                : language === "it"
                  ? "Elimina"
                  : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open && !updatingRole) {
            setRoleTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "it" ? "Ruolo membro" : "Member role"}
            </DialogTitle>
            <DialogDescription>
              {language === "it"
                ? `Seleziona il ruolo per ${roleTarget?.email ?? "questo utente"}.`
                : `Select the role for ${roleTarget?.email ?? "this member"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className={cn(textStyle.caption, "text-muted-foreground")}>
              {language === "it" ? "Ruolo" : "Role"}
            </label>
            <select
              value={roleChoice}
              onChange={(event) =>
                setRoleChoice(event.target.value as MemberRole | "other")
              }
              disabled={updatingRole}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="owner">{language === "it" ? "Proprietario" : "Owner"}</option>
              <option value="member">{language === "it" ? "Membro" : "Member"}</option>
              <option value="other">{language === "it" ? "Altro" : "Other"}</option>
            </select>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRoleTarget(null)}
              disabled={updatingRole}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button onClick={() => void handleUpdateRole()} disabled={updatingRole}>
              {updatingRole
                ? language === "it"
                  ? "Salvataggio..."
                  : "Saving..."
                : language === "it"
                  ? "Salva"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSectionCard>
  );
}
