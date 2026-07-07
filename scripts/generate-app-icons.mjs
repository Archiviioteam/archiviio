import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcTauri = path.join(root, "src-tauri");
const sourceIcon = path.join(srcTauri, "app-icon-source.png");
const appIcon = path.join(srcTauri, "app-icon.png");
const swiftScript = path.join(root, "scripts", "prepare-macos-app-icon.swift");
const iconsDir = path.join(srcTauri, "icons");

if (!existsSync(sourceIcon)) {
  throw new Error(`Missing source icon: ${sourceIcon}`);
}

execFileSync("swift", [swiftScript, sourceIcon, appIcon], { stdio: "inherit" });

execFileSync(
  "npx",
  ["tauri", "icon", "src-tauri/app-icon.png", "-o", "src-tauri/icons", "--ios-color", "#ffffff"],
  { cwd: root, stdio: "inherit" },
);

for (const target of ["icon.png", "apple-icon.png"]) {
  copyFileSync(path.join(iconsDir, "icon.png"), path.join(root, "src", "app", target));
}

console.log("App icons regenerated with macOS squircle shape.");
