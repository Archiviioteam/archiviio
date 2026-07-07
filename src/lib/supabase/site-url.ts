export function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`;
}

/** Redirect URLs that must be allowed in Supabase Auth settings. */
export const SUPABASE_AUTH_REDIRECT_URLS = [
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
] as const;
