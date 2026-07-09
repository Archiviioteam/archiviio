export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

type DeleteAccountApiPayload = {
  error?: string;
};

export async function deleteAccount(): Promise<DeleteAccountResult> {
  let response: Response;

  try {
    response = await fetch("/api/account", {
      method: "DELETE",
    });
  } catch {
    return { ok: false, error: "Network error while deleting account" };
  }

  let data: DeleteAccountApiPayload | null = null;
  try {
    data = (await response.json()) as DeleteAccountApiPayload;
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error:
        data?.error && typeof data.error === "string"
          ? data.error
          : "Failed to delete account",
    };
  }

  return { ok: true };
}
