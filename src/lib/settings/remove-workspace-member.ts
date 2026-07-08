export type RemoveWorkspaceMemberResult =
  | { ok: true }
  | { ok: false; error: string };

type RemoveMemberApiPayload = {
  error?: string;
};

function normalizeRemoveMemberError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("only workspace owners")) {
    return "Solo il proprietario dello spazio può rimuovere membri";
  }

  if (lower.includes("cannot remove yourself")) {
    return "Non puoi rimuovere il tuo utente";
  }

  if (lower.includes("owners cannot be removed")) {
    return "Non puoi rimuovere un proprietario";
  }

  if (lower.includes("member not found")) {
    return "Utente non trovato nello spazio di lavoro";
  }

  return message;
}

export async function removeWorkspaceMember(
  memberId: string
): Promise<RemoveWorkspaceMemberResult> {
  let response: Response;

  try {
    response = await fetch(`/api/team-members/${memberId}`, {
      method: "DELETE",
    });
  } catch {
    return { ok: false, error: "Errore di rete durante la rimozione dell'utente" };
  }

  let data: RemoveMemberApiPayload | null = null;
  try {
    data = (await response.json()) as RemoveMemberApiPayload;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error && typeof data.error === "string"
        ? normalizeRemoveMemberError(data.error)
        : "Impossibile rimuovere l'utente";
    return { ok: false, error: message };
  }

  return { ok: true };
}
