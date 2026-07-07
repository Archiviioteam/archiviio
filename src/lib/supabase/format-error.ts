export function isSchemaCacheError(message: string): boolean {
  return /schema cache/i.test(message);
}

export function formatClientError(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error instanceof Error) {
    const message = error.message;

    if (/load failed|failed to fetch|networkerror|network request failed/i.test(message)) {
      return "Connection error. Check your network and try again.";
    }

    if (isSchemaCacheError(message)) {
      return formatSchemaCacheError(message);
    }

    return message;
  }

  return fallback;
}

function formatSchemaCacheError(message: string): string {
  if (/workspace_notes/i.test(message)) {
    return "Notes are still syncing with the database. Retrying...";
  }

  return "Database is updating. Wait a few seconds and try again.";
}

export function formatSupabaseError(message: string): string {
  if (isSchemaCacheError(message)) {
    return formatSchemaCacheError(message);
  }

  return message;
}
