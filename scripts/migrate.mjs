import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

export function buildPgConfig(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error("DATABASE_URL wajib diisi sebelum menjalankan migrasi.");
  }
  const parsed = new URL(rawUrl.trim());
  const host = parsed.hostname.toLowerCase();
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
  const isNeon = host.includes("neon.tech") || host.includes("neon.build");
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (isNeon || sslMode) {
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("channel_binding");
  }
  const needsSsl = isNeon || (sslMode !== undefined && sslMode !== "disable") || (!isLocal && sslMode !== "disable");
  return {
    connectionString: parsed.toString(),
    max: 2,
    connectionTimeoutMillis: 15_000,
    ssl: needsSsl ? { rejectUnauthorized: true } : false,
  };
}

export const MIGRATION_FILES = [
  "drizzle/migrations/0000_baseline.sql",
  "scripts/sql/001_integrity.sql",
  "scripts/sql/002_rls_and_tenant_fk.sql",
  "scripts/sql/003_features_and_exports.sql",
];

async function main() {
  loadDotEnv();
  const pool = new Pool(buildPgConfig(process.env.DATABASE_URL));
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const relPath of MIGRATION_FILES) {
      const abs = resolve(process.cwd(), relPath);
      if (!existsSync(abs)) {
        console.log(`[skip] ${relPath} (file belum ada)`);
        continue;
      }
      const sql = readFileSync(abs, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");

      const existing = await pool.query("SELECT checksum FROM schema_migrations WHERE id = $1", [relPath]);
      if (existing.rows.length > 0) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Checksum mismatch pada ${relPath}! File migrasi yang sudah diterapkan tidak boleh diubah.`);
        }
        console.log(`[ok]   ${relPath} (sudah diterapkan)`);
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)", [relPath, checksum]);
        await client.query("COMMIT");
        console.log(`[apply] ${relPath}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Gagal menerapkan ${relPath}: ${err.message}`);
      } finally {
        client.release();
      }
    }
    console.log("Semua migrasi selesai.");
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[migrate] ERROR:", err.message);
    process.exit(1);
  });
}
