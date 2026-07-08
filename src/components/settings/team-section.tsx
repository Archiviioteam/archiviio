"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { removeWorkspaceMember } from "@/lib/settings/remove-workspace-member";
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
            .in("status", ["pending", "accepted"])
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
                <Badge variant="secondary">{roleLabel(member.role, language)}</Badge>
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
    </SettingsSectionCard>
  );
}
