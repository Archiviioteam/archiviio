export interface MailboxSyncResult {
  imported?: number;
  matched?: number;
  errors?: string[];
}

export function formatSyncSuccessMessage(
  payload: MailboxSyncResult,
  it: boolean
): string {
  const imported = payload.imported ?? 0;
  const matched = payload.matched ?? 0;

  if (it) {
    if (imported === 0) {
      return "Sincronizzazione completata: nessuna nuova mail trovata.";
    }
    return `Sincronizzate ${imported} mail (${matched} assegnate ai progetti)`;
  }

  if (imported === 0) {
    return "Sync completed: no new emails found.";
  }

  return `Synced ${imported} emails (${matched} matched to projects)`;
}

export function getSyncErrorMessage(payload: MailboxSyncResult): string | null {
  const firstError = payload.errors?.find(Boolean);
  return firstError ?? null;
}
