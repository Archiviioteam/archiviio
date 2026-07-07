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

type AuthLikeError = {
  message?: string;
  code?: string;
  status?: number;
};

type RpcLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_exists:
    "An account with this email already exists. Try signing in instead.",
  user_already_exists:
    "An account with this email already exists. Try signing in instead.",
  signup_disabled: "New sign-ups are currently disabled.",
  email_provider_disabled:
    "Email sign-ups are disabled in Supabase Auth settings.",
  validation_failed: "Please check your email and password and try again.",
  weak_password: "Choose a stronger password (at least 6 characters).",
  over_email_send_rate_limit:
    "Too many confirmation emails were sent. Wait a few minutes and try again.",
  over_request_rate_limit:
    "Too many attempts. Wait a few minutes and try again.",
  unexpected_failure:
    "Could not send the confirmation email. In Supabase Dashboard go to Authentication → Email: configure SMTP, or turn off “Confirm email”.",
};

function isEmptyErrorMessage(message: string | undefined): boolean {
  const trimmed = message?.trim();
  return !trimmed || trimmed === "{}";
}

export function formatAuthError(
  error: AuthLikeError | null | undefined,
  fallback = "Sign-up failed. Please try again."
): string {
  if (!error) {
    return fallback;
  }

  const message = error.message?.trim();
  if (message && !isEmptyErrorMessage(message)) {
    if (/confirmation email|sending confirmation/i.test(message)) {
      return AUTH_ERROR_MESSAGES.unexpected_failure;
    }

    return formatSupabaseError(message);
  }

  const code = error.code?.trim();
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (error.status === 422) {
    return "Please check your email and password and try again.";
  }

  if (error.status === 429) {
    return "Too many attempts. Wait a few minutes and try again.";
  }

  if (isEmptyErrorMessage(message)) {
    return "Registration could not be completed. Verify Supabase Auth settings (email signups enabled and production callback URL allowed), then try again.";
  }

  return fallback;
}

export function formatRpcError(
  error: RpcLikeError | null | undefined,
  fallback = "Something went wrong"
): string {
  if (!error) {
    return fallback;
  }

  const message = error.message?.trim();
  if (message && !isEmptyErrorMessage(message)) {
    return formatSupabaseError(message);
  }

  const details = error.details?.trim();
  if (details) {
    return details;
  }

  const hint = error.hint?.trim();
  if (hint) {
    return hint;
  }

  return fallback;
}
