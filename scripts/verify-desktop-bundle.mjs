import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const RUNTIME_ENV_LOOKUP_MARKERS = [
  'sr("NEXT_PUBLIC_SUPABASE_URL")',
  'sr("NEXT_PUBLIC_SUPABASE_ANON_KEY")',
  "process.env[e]",
];

function collectJsFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      collectJsFiles(path, files);
      continue;
    }

    if (entry.name.endsWith(".js")) {
      files.push(path);
    }
  }

  return files;
}

const outDir = join(process.cwd(), "out");
const chunksDir = join(outDir, "_next", "static", "chunks");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

if (!supabaseUrl) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL is not set.");
  process.exit(1);
}

const jsFiles = collectJsFiles(chunksDir);

if (jsFiles.length === 0) {
  console.error(`Error: no JS chunks found in ${chunksDir}.`);
  process.exit(1);
}

const hasInlinedUrl = jsFiles.some((file) =>
  readFileSync(file, "utf8").includes(supabaseUrl)
);

if (!hasInlinedUrl) {
  console.error(
    "Error: Supabase URL was not inlined into the desktop frontend bundle."
  );
  console.error(
    "The packaged app would fail at runtime because Tauri cannot read process.env."
  );
  process.exit(1);
}

const hasRuntimeEnvLookup = jsFiles.some((file) => {
  const content = readFileSync(file, "utf8");
  return RUNTIME_ENV_LOOKUP_MARKERS.some((marker) => content.includes(marker));
});

if (hasRuntimeEnvLookup) {
  console.error(
    "Error: desktop bundle still resolves Supabase env vars at runtime."
  );
  process.exit(1);
}

console.log("Desktop bundle verification passed.");
