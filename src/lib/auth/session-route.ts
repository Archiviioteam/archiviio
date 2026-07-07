import { isAuthPage, isPublicPath } from "@/lib/auth/routes";

export function getSessionRedirect(
  pathname: string,
  search: string,
  isAuthenticated: boolean
): string | null {
  if (pathname.startsWith("/auth/callback")) {
    return null;
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const next = `${pathname}${search}`;
    return `/login?next=${encodeURIComponent(next)}`;
  }

  if (isAuthenticated && isAuthPage(pathname)) {
    return "/dashboard";
  }

  if (isAuthenticated && pathname === "/") {
    return "/dashboard";
  }

  return null;
}
