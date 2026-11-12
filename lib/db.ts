// Veritabanı: DATABASE_URL varsa gerçek PostgreSQL (Supabase), yoksa yerel PGlite (aynı SQL, dosyada).
// Uygulamanın geri kalanı yalnız q() kullanır; hangi motorun çalıştığını bilmez.
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Satir = Record<string, unknown>;
type Motor = { sorgu: (metin: string, p: unknown[]) => Promise<Satir[]>; kapat: () => Promise<void> };

const g = globalThis as unknown as { __fdMotor?: Promise<Motor> };

async function motorKur(): Promise<Motor> {
  const url = process.env.DATABASE_URL;
  let m: Motor;
  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
    m = { sorgu: (t, p) => sql.unsafe(t, p as never[]) as unknown as Promise<Satir[]>, kapat: () => sql.end() };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dizin = process.env.PGLITE_DIR ?? join(process.cwd(), ".veri", "pglite");
    (await import("node:fs")).mkdirSync(dizin, { recursive: true });
    const db = new PGlite(dizin);
    m = { sorgu: async (t, p) => (await db.query<Satir>(t, p)).rows, kapat: () => db.close() };
  }
  const var_ = await m.sorgu("select to_regclass('public.takip') as t", []);
  if (!var_[0]?.t) {
    const sema = readFileSync(join(process.cwd(), "db", "sema.sql"), "utf8");
    for (const parca of sema.split(/;\s*\n/).map((s) => s.trim()).filter((s) => s && !/^--[^\n]*$/.test(s))) await m.sorgu(parca, []);
  }
  return m;
}

const motor = () => (g.__fdMotor ??= motorKur());

export async function q<T = Satir>(metin: string, p: unknown[] = []): Promise<T[]> {
  return (await (await motor()).sorgu(metin, p)) as T[];
}
export async function q1<T = Satir>(metin: string, p: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(metin, p))[0];
}
export async function kapat() {
  if (g.__fdMotor) { await (await g.__fdMotor).kapat(); g.__fdMotor = undefined; }
}
