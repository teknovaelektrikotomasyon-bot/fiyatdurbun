// Klasik üyelik: kayıt (ad, kullanıcı adı, e-posta, şifre), e-posta ya da kullanıcı adıyla giriş, şifre sıfırlama.
// Şifreler scrypt ile tuzlanıp özetlenir; şifrenin kendisi hiçbir yerde saklanmaz.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { q, q1 } from "./db.ts";

const scrypt = promisify(scryptCb) as (s: string, tuz: Buffer, uzunluk: number) => Promise<Buffer>;
const ozet = (s: string) => createHash("sha256").update(s).digest("hex");

let semaHazir = false;
/** uye tablosuna üyelik sütunlarını ekler (yalnız eksikse; tek seferlik). */
export async function uyelikSemasi() {
  if (semaHazir) return;
  const sutunlar = new Set((await q<{ c: string }>("select column_name c from information_schema.columns where table_name='uye'")).map((r) => r.c));
  const ekle: [string, string][] = [
    ["kullanici_adi", "text"], ["sifre_ozet", "text"], ["kvkk_onay", "timestamptz"], ["ileti_izni", "boolean not null default false"],
    ["eposta_onay", "timestamptz"],
  ];
  for (const [ad, tur] of ekle) if (!sutunlar.has(ad)) await q(`alter table uye add column ${ad} ${tur}`);
  await q("create unique index if not exists uye_kullanici_adi on uye (lower(kullanici_adi))");
  const jSutun = new Set((await q<{ c: string }>("select column_name c from information_schema.columns where table_name='giris_jetonu'")).map((r) => r.c));
  if (!jSutun.has("amac")) await q("alter table giris_jetonu add column amac text not null default 'giris'");
  await q(`create table if not exists giris_denemesi (kimlik text not null, zaman timestamptz not null default now())`);
  semaHazir = true;
}

export async function sifreOzetle(sifre: string) {
  const tuz = randomBytes(16);
  const h = await scrypt(sifre, tuz, 64);
  return `scrypt$${tuz.toString("base64url")}$${h.toString("base64url")}`;
}

export async function sifreDogru(sifre: string, kayit: string | null) {
  if (!kayit) return false;
  const [tur, tuz, h] = kayit.split("$");
  if (tur !== "scrypt" || !tuz || !h) return false;
  const beklenen = Buffer.from(h, "base64url");
  const gelen = await scrypt(sifre, Buffer.from(tuz, "base64url"), beklenen.length);
  return timingSafeEqual(gelen, beklenen);
}

/** En az 8 karakter, en az bir harf ve bir rakam. */
export const sifreGuclu = (s: string) => s.length >= 8 && s.length <= 128 && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s) && /\d/.test(s);
export const kullaniciAdiGecerli = (s: string) => /^[a-z0-9_.]{3,24}$/i.test(s);

/** Son 15 dakikada bu kimlikle 5'ten çok hatalı deneme varsa giriş geçici olarak kapanır. */
export async function denemeSiniri(kimlik: string) {
  const r = await q1<{ n: number }>("select count(*)::int n from giris_denemesi where kimlik=$1 and zaman > now() - interval '15 minutes'", [kimlik.toLowerCase()]);
  return (r?.n ?? 0) >= 5;
}
export async function hataliDeneme(kimlik: string) {
  await q("insert into giris_denemesi (kimlik) values ($1)", [kimlik.toLowerCase()]);
  await q("delete from giris_denemesi where zaman < now() - interval '1 day'");
}

export async function girisDogrula(kimlik: string, sifre: string) {
  const k = kimlik.trim().toLowerCase();
  const u = await q1<{ id: number; sifre_ozet: string | null }>(
    "select id, sifre_ozet from uye where lower(eposta)=$1 or lower(kullanici_adi)=$1 limit 1", [k]);
  // Kullanıcı yoksa da aynı süre harcansın (kullanıcı adı tahmini zorlaşsın)
  const tamam = await sifreDogru(sifre, u?.sifre_ozet ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAA");
  if (!u || !tamam) return null;
  await q("update uye set son_giris=now() where id=$1", [u.id]);
  return u.id;
}

export async function sifirlamaJetonu(eposta: string) {
  const jeton = randomBytes(24).toString("base64url");
  await q("insert into giris_jetonu (jeton_ozet, eposta, son, amac) values ($1, $2, now() + interval '30 minutes', 'sifre')", [ozet(jeton), eposta.toLowerCase()]);
  return jeton;
}

/** Sıfırlama jetonu geçerliyse şifreyi değiştirir ve üye no'sunu döner (jeton tek kullanımlıktır). */
export async function sifreYenile(jeton: string, yeni: string) {
  const r = await q1<{ eposta: string }>(
    "update giris_jetonu set kullanildi=now() where jeton_ozet=$1 and amac='sifre' and kullanildi is null and son > now() returning eposta", [ozet(jeton)]);
  if (!r) return null;
  const u = await q1<{ id: number }>("update uye set sifre_ozet=$2, eposta_onay=coalesce(eposta_onay, now()), son_giris=now() where lower(eposta)=$1 returning id",
    [r.eposta, await sifreOzetle(yeni)]);
  return u?.id ?? null;
}

export async function jetonGecerli(jeton: string) {
  return Boolean(await q1("select 1 from giris_jetonu where jeton_ozet=$1 and amac='sifre' and kullanildi is null and son > now()", [ozet(jeton)]));
}
