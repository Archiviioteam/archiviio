import { spawnSync } from "node:child_process";
import { utimesSync } from "node:fs";
import { join } from "node:path";
import { requirePublicSupabaseEnv } from "./load-env-local.mjs";

requirePublicSupabaseEnv();

process.env.TAURI_ENV = "1";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const verify = spawnSync("node", ["scripts/verify-desktop-bundle.mjs"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if ((verify.status ?? 1) !== 0) {
  process.exit(verify.status ?? 1);
}

// Force Tauri to re-embed the freshly built frontend into the Rust binary.
const now = new Date();
utimesSync(join(process.cwd(), "src-tauri", "build.rs"), now, now);

process.exit(0);
