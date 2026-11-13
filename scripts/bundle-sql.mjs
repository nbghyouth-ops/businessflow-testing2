import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION_FILES = [
  "drizzle/migrations/0000_baseline.sql",
  "scripts/sql/001_integrity.sql",
  "scripts/sql/002_rls_and_tenant_fk.sql",
  "scripts/sql/003_features_and_exports.sql",
];

const chunks = [
  "-- Business Flow — ALL_IN_ONE.sql",
  "-- Dihasilkan otomatis oleh scripts/bundle-sql.mjs. Aman ditempel di Neon SQL Editor.",
  "",
  "CREATE TABLE IF NOT EXISTS schema_migrations (",
  "  id TEXT PRIMARY KEY,",
  "  checksum TEXT NOT NULL,",
  "  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()",
  ");",
  "",
];

for (const relPath of MIGRATION_FILES) {
  const abs = resolve(process.cwd(), relPath);
  if (!existsSync(abs)) continue;
  const sql = readFileSync(abs, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  chunks.push(`-- === BEGIN ${relPath} ===`);
  chunks.push(sql.trim());
  chunks.push(
    `INSERT INTO schema_migrations (id, checksum) VALUES ('${relPath}', '${checksum}') ON CONFLICT (id) DO NOTHING;`,
  );
  chunks.push(`-- === END ${relPath} ===`);
  chunks.push("");
}

const outPath = resolve(process.cwd(), "drizzle/ALL_IN_ONE.sql");
writeFileSync(outPath, chunks.join("\n"), "utf8");
console.log(`Berhasil membuat ${outPath}`);
