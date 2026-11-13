// Oturum: imzalı çerez. Şifreli giriş lib/uyelik.ts'te; eski şifresiz bağlantılar (giris_jetonu, amac='giris') da çalışır.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { q, q1 } from "./db.ts";

const CEREZ = "fd_oturum";
// İmza sırrı: OTURUM_SIRRI; tanımlı değilse sunucuya özel DATABASE_URL'den türetilir (istemciye hiç gitmez).
const sir = () => process.env.OTURUM_SIRRI
  ?? (process.env.DATABASE_URL ? createHash("sha256").update("fd-oturum:" + process.env.DATABASE_URL).digest("hex") : "gelistirme-sirri-degistir");
const ozet = (s: string) => createHash("sha256").update(s).digest("hex");
const imza = (s: string) => createHmac("sha256", sir()).update(s).digest("base64url");

export const epostaGecerli = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e);

export async function girisJetonuOlustur(eposta: string) {
  const jeton = randomBytes(24).toString("base64url");
  await q("insert into giris_jetonu (jeton_ozet, eposta, son) values ($1, $2, now() + interval '15 minutes')", [ozet(jeton), eposta.toLowerCase()]);
  return jeton;
}

export async function jetonuKullan(jeton: string) {
  const r = await q1<{ eposta: string }>(
    "update giris_jetonu set kullanildi=now() where jeton_ozet=$1 and coalesce(amac,'giris')='giris' and kullanildi is null and son > now() returning eposta", [ozet(jeton)]);
  if (!r) return null;
  const uye = await q1<{ id: number }>(
    "insert into uye (eposta, son_giris) values ($1, now()) on conflict (eposta) do update set son_giris=now() returning id", [r.eposta]);
  return uye!.id;
}

/** hatirla=false: tarayıcı kapanınca biten oturum çerezi; true: 90 gün. */
export async function oturumAc(uyeId: number, hatirla = true) {
  const deger = `${uyeId}.${Date.now()}`;
  (await cookies()).set(CEREZ, `${deger}.${imza(deger)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(hatirla ? { maxAge: 60 * 60 * 24 * 90 } : {}) });
}

export async function oturumKapat() {
  (await cookies()).delete(CEREZ);
}

export async function uye() {
  const c = (await cookies()).get(CEREZ)?.value;
  if (!c) return null;
  const [id, zaman, sig] = c.split(".");
  const beklenen = imza(`${id}.${zaman}`);
  if (!sig || sig.length !== beklenen.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(beklenen))) return null;
  return q1<{ id: number; eposta: string; ad: string | null }>("select id, eposta, ad from uye where id=$1", [Number(id)]);
}
