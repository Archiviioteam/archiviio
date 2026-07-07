import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, "src", "app", "(app)");

const sidebarRoutes = [
  { href: "/dashboard", page: "dashboard/page.tsx" },
  { href: "/projects", page: "projects/page.tsx" },
  { href: "/tasks", page: "tasks/page.tsx" },
  { href: "/contacts", page: "contacts/page.tsx" },
  { href: "/suppliers", page: "suppliers/page.tsx" },
  { href: "/documents", page: "documents/page.tsx" },
  { href: "/nomenclature", page: "nomenclature/page.tsx" },
  { href: "/settings", page: "settings/page.tsx" },
];

const activeRouteCases = [
  ["/dashboard", "/dashboard"],
  ["/projects", "/projects"],
  ["/projects/new", "/projects"],
  ["/projects/abc-123", "/projects"],
  ["/tasks", "/tasks"],
  ["/contacts", "/contacts"],
  ["/contacts?action=create", "/contacts"],
  ["/suppliers", "/suppliers"],
  ["/documents", "/documents"],
  ["/nomenclature", "/nomenclature"],
  ["/settings", "/settings"],
  ["/settings/profile", "/settings"],
  ["/settings/workspace", "/settings"],
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`OK: ${message}`);
}

console.log("Navigation integrity check\n");

for (const route of sidebarRoutes) {
  const pagePath = join(appDir, route.page);
  if (!existsSync(pagePath)) {
    fail(`Missing page for ${route.href} (${route.page})`);
  } else {
    pass(`${route.href} -> ${route.page}`);
  }
}

const { getActiveNavHref, sidebarNavItems } = await import(
  join(root, "src", "lib", "layout", "navigation.ts")
);

const navHrefs = new Set(sidebarNavItems.map((item) => item.href));
for (const route of sidebarRoutes) {
  if (!navHrefs.has(route.href)) {
    fail(`Sidebar config missing href ${route.href}`);
  }
}

for (const [pathname, expected] of activeRouteCases) {
  const active = getActiveNavHref(pathname);
  if (active !== expected) {
    fail(`Active nav for ${pathname}: got ${active}, expected ${expected}`);
  } else {
    pass(`Active nav ${pathname} -> ${expected}`);
  }
}

const devServer = process.env.NAV_CHECK_URL ?? "http://localhost:3000";
let liveChecks = false;

for (const route of sidebarRoutes) {
  try {
    const response = await fetch(`${devServer}${route.href}`, {
      redirect: "manual",
    });
    const status = response.status;
    const location = response.headers.get("location");

    if (status === 404) {
      fail(`Live route ${route.href} returned 404`);
      continue;
    }

    if (status === 307 || status === 308) {
      if (location?.includes("/login")) {
        pass(`Live route ${route.href} -> auth redirect (${status})`);
        liveChecks = true;
        continue;
      }
      fail(`Live route ${route.href} unexpected redirect: ${location}`);
      continue;
    }

    if (status === 200) {
      pass(`Live route ${route.href} -> 200`);
      liveChecks = true;
      continue;
    }

    fail(`Live route ${route.href} returned HTTP ${status}`);
  } catch {
    if (!liveChecks) {
      console.log(
        `SKIP: Live HTTP checks (${devServer} unavailable — start npm run dev to verify)`
      );
    }
    break;
  }
}

console.log("");
if (failures > 0) {
  console.error(`Navigation integrity check failed (${failures} issue(s)).`);
  process.exit(1);
}

console.log("Navigation integrity check passed.");
