import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const targetRoot = join(process.cwd(), "src-tauri", "target");
const bundleRoots = [
  join(targetRoot, "release", "bundle"),
  join(targetRoot, "x86_64-pc-windows-msvc", "release", "bundle"),
];

const targets = [
  { dir: "macos", label: "macOS app", extensions: [".app"] },
  { dir: "dmg", label: "macOS disk image", extensions: [".dmg"] },
  { dir: "msi", label: "Windows installer", extensions: [".msi"] },
  { dir: "nsis", label: "Windows setup", extensions: [".exe"] },
];

function collectFiles(directory, extensions) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .filter((name) => extensions.some((ext) => name.endsWith(ext)))
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile() || path.endsWith(".app"));
}

console.log("\nDesktop build artifacts:\n");

let found = false;

for (const target of targets) {
  const files = bundleRoots.flatMap((bundleRoot) =>
    collectFiles(join(bundleRoot, target.dir), target.extensions)
  );

  if (files.length === 0) {
    continue;
  }

  found = true;

  for (const file of files) {
    console.log(`  ${target.label}: ${file}`);
  }
}

if (!found) {
  console.log("  No bundle artifacts found under src-tauri/target/release/bundle/");
  console.log("  Run npm run tauri:build:mac or npm run tauri:build:windows first.");
}

console.log("");
