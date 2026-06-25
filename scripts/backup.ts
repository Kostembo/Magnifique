import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();

// Parse .env.local
const envRaw = readFileSync(join(root, ".env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const url = env.DIRECT_URL;
if (!url) { console.error("DIRECT_URL not found in .env.local"); process.exit(1); }

mkdirSync(join(root, "backups"), { recursive: true });

const ts = new Date().toISOString().replace(/[:T]/g, "-").replace(/\.\d+Z$/, "");
const file = join(root, "backups", `magnifique_${ts}.dump`);

console.log(`Backup → ${file}`);
execSync(`pg_dump "${url}" -F c -f "${file}"`, { stdio: "inherit" });
console.log("Done. Restore: pg_restore -d <DB_URL> --clean " + file);
