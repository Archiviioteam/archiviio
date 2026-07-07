export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/api/signup" ||
    pathname.startsWith("/api/invite/")
  );
}

export function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

export function getSafeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  const pathname = next.split("?")[0] ?? next;

  if (isPublicPath(pathname)) {
    return "/dashboard";
  }

  return next;
}
