// Storage adapter: local dev uses better-sqlite3 (file), production uses Turso (libSQL) when
// TURSO_DATABASE_URL is set. Both expose the same tiny async interface so the rest of the app
// never knows which one it is talking to.
import fs from "fs";
import path from "path";

export type Row = Record<string, unknown>;
export type Stmt = [sql: string, args?: unknown[]];
export interface Store {
  kind: "sqlite" | "turso";
  all<T = Row>(sql: string, args?: unknown[]): Promise<T[]>;
  run(sql: string, args?: unknown[]): Promise<{ lastId: number }>;
  /** Run several statements atomically (one transaction / one round-trip on Turso). */
  batch(stmts: Stmt[]): Promise<void>;
}

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY, name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS chunks(id INTEGER PRIMARY KEY, doc_id INTEGER, doc_name TEXT, text TEXT, embedding TEXT)",
  "CREATE TABLE IF NOT EXISTS conversations(id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY, name TEXT, email TEXT, company TEXT, message TEXT, session_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS lead_state(session_id TEXT PRIMARY KEY, data TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)",
];

async function openSqlite(): Promise<Store> {
  // Vercel's filesystem is read-only except /tmp (ephemeral) - use Turso there for persistence.
  const dir = process.env.DATA_DIR || (process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data"));
  fs.mkdirSync(dir, { recursive: true });
  const Database = (await import("better-sqlite3")).default;
  const d = new Database(path.join(dir, "docschat.db"));
  d.pragma("journal_mode = WAL");
  for (const s of SCHEMA) d.exec(s);
  return {
    kind: "sqlite",
    async all<T>(sql: string, args: unknown[] = []) { return d.prepare(sql).all(...args) as T[]; },
    async run(sql, args = []) { return { lastId: Number(d.prepare(sql).run(...args).lastInsertRowid) }; },
    async batch(stmts) { d.transaction(() => { for (const [sql, args = []] of stmts) d.prepare(sql).run(...args); })(); },
  };
}

async function openTurso(): Promise<Store> {
  const { createClient } = await import("@libsql/client");
  const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  await c.batch(SCHEMA, "write");
  return {
    kind: "turso",
    async all<T>(sql: string, args: unknown[] = []) {
      const r = await c.execute({ sql, args: args as never[] });
      return r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, row[i]]))) as T[];
    },
    async run(sql, args = []) {
      const r = await c.execute({ sql, args: args as never[] });
      return { lastId: Number(r.lastInsertRowid ?? 0) };
    },
    async batch(stmts) { await c.batch(stmts.map(([sql, args = []]) => ({ sql, args: args as never[] })), "write"); },
  };
}

const g = globalThis as unknown as { _store?: Promise<Store> };
export function store(): Promise<Store> {
  if (!g._store) {
    g._store = (process.env.TURSO_DATABASE_URL ? openTurso() : openSqlite()).catch((e) => { g._store = undefined; throw e; });
  }
  return g._store;
}
