import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const migrationsDir = resolve(projectRoot, "supabase/migrations");
const outputPath = resolve(projectRoot, "supabase/full_schema.sql");

const files = readdirSync(migrationsDir)
  .filter((name) => /^\d{3}_.*\.sql$/.test(name))
  .sort();

let sql = [
  "-- Archiviio full schema",
  "-- Paste and run once in Supabase SQL Editor (project: archiviio)",
  "-- Source: supabase/migrations/001..024",
  "",
].join("\n");

for (const file of files) {
  sql += `\n-- ${"=".repeat(72)}\n`;
  sql += `-- ${file}\n`;
  sql += `-- ${"=".repeat(72)}\n\n`;
  sql += `${readFileSync(resolve(migrationsDir, file), "utf8").trim()}\n`;
}

writeFileSync(outputPath, sql, "utf8");
console.log(`Wrote ${outputPath} (${files.length} migrations).`);
