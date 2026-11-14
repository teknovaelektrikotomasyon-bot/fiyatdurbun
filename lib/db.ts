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
    // Uzun süren betikler (GitHub Actions) Supabase havuzunun oturum kipini (5432) kullanır. İşlem kipinde (6543)
    // aynı bağlantıdan art arda gönderilen sorguların cevapları karışabiliyor: "olmayan marka" yabancı anahtar
    // hatası ve "string bekleniyordu, sayı geldi" gibi rastgele hatalar bundandı. Site (Vercel) işlem kipinde kalır.
    const hedef = !process.env.VERCEL && process.env.DB_ISLEM_KIPI !== "1" && /pooler\.supabase\.com:6543\b/.test(url)
      ? url.replace(":6543", ":5432") : url;
    const sql = postgres(hedef, { max: 5, prepare: false, idle_timeout: 20, connect_timeout: 10, max_lifetime: 60 * 5 });
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

// Sunucusuz ortamda işlev dondurulup uyandığında havuzdaki bağlantı ölü olabilir (veritabanı tarafı kapatmıştır);
// o zaman sorgu cevapsız kalır. Belirli sürede cevap gelmezse havuz kapatılıp yeniden kurulur ve sorgu bir kez
// daha denenir. Toplayıcı gibi uzun işler için süre ortam değişkeniyle büyütülebilir.
const SORGU_SURESI = Number(process.env.SORGU_ZAMAN_ASIMI_MS ?? 8000);

async function sureli<T>(is: Promise<T>, ms: number): Promise<T> {
  let zamanlayici: ReturnType<typeof setTimeout> | undefined;
  const asim = new Promise<never>((_, red) => { zamanlayici = setTimeout(() => red(Object.assign(new Error("sorgu zaman aşımı"), { zamanAsimi: true })), ms); });
  try { return await Promise.race([is, asim]); } finally { clearTimeout(zamanlayici); }
}

export async function q<T = Satir>(metin: string, p: unknown[] = []): Promise<T[]> {
  // postgres.js undefined parametreyi reddeder (UNDEFINED_VALUE); eksik alanlar NULL olarak yazılır.
  p = p.map((v) => (v === undefined ? null : v));
  // Bağlantı koparsa (Supabase havuzu ara sıra bağlantıyı kapatır) yeni bağlantıyla 3 kez, artan beklemeyle yeniden dener.
  for (let deneme = 0; ; deneme++) {
    try {
      return (await sureli((await motor()).sorgu(metin, p), SORGU_SURESI)) as T[];
    } catch (e) {
      const err = e as { zamanAsimi?: boolean; code?: string; message?: string };
      const baglantiHatasi = err.zamanAsimi || ["ECONNRESET", "EPIPE", "ETIMEDOUT", "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECTION_DESTROYED"].includes(err.code ?? "")
        || /CONNECTION_ENDED|ECONNRESET|terminating connection/.test(err.message ?? "");
      if (!baglantiHatasi || !process.env.DATABASE_URL || deneme >= 3) throw e;
      const eski = g.__fdMotor;
      g.__fdMotor = undefined;
      eski?.then((m) => m.kapat()).catch(() => {});
      await new Promise((r) => setTimeout(r, [2000, 5000, 10000][deneme]));
    }
  }
}
export async function q1<T = Satir>(metin: string, p: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(metin, p))[0];
}
export async function kapat() {
  if (g.__fdMotor) { await (await g.__fdMotor).kapat(); g.__fdMotor = undefined; }
}
