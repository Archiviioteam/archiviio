export interface MailboxSyncResult {
  imported?: number;
  matched?: number;
  errors?: string[];
  hasMore?: boolean;
}

export function formatSyncSuccessMessage(
  payload: MailboxSyncResult,
  it: boolean
): string {
  const imported = payload.imported ?? 0;
  const matched = payload.matched ?? 0;
  const hasMore = payload.hasMore ?? false;

  if (it) {
    if (imported === 0) {
      return hasMore
        ? "Sincronizzazione parziale completata. Clicca di nuovo Sincronizza per continuare."
        : "Sincronizzazione completata: nessuna nuova mail trovata.";
    }
    const base = `Sincronizzate ${imported} mail (${matched} assegnate ai progetti)`;
    return hasMore ? `${base}. Clicca di nuovo Sincronizza per importare altre mail.` : base;
  }

  if (imported === 0) {
    return hasMore
      ? "Partial sync completed. Click Sync again to continue."
      : "Sync completed: no new emails found.";
  }

  const base = `Synced ${imported} emails (${matched} matched to projects)`;
  return hasMore ? `${base}. Click Sync again to import more emails.` : base;
}

export function getSyncErrorMessage(payload: MailboxSyncResult): string | null {
  const firstError = payload.errors?.find(Boolean);
  return firstError ?? null;
}
