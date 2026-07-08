import type { MemberRole } from "@/types/database";

export type UpdateWorkspaceMemberRoleResult =
  | { ok: true }
  | { ok: false; error: string };

type UpdateRoleApiPayload = {
  error?: string;
};

function normalizeUpdateRoleError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("unsupported role")) {
    return "Ruolo non supportato";
  }

  if (lower.includes("cannot change your own role")) {
    return "Non puoi cambiare il tuo ruolo";
  }

  if (lower.includes("member not found")) {
    return "Utente non trovato nello spazio di lavoro";
  }

  return message;
}

export async function updateWorkspaceMemberRole(
  memberId: string,
  role: MemberRole
): Promise<UpdateWorkspaceMemberRoleResult> {
  let response: Response;

  try {
    response = await fetch(`/api/team-members/${memberId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  } catch {
    return { ok: false, error: "Errore di rete durante l'aggiornamento ruolo" };
  }

  let data: UpdateRoleApiPayload | null = null;
  try {
    data = (await response.json()) as UpdateRoleApiPayload;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error && typeof data.error === "string"
        ? normalizeUpdateRoleError(data.error)
        : "Impossibile aggiornare il ruolo";
    return { ok: false, error: message };
  }

  return { ok: true };
}
