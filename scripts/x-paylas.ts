// X (Twitter) hesabında doğrulanmış gerçek indirimleri paylaşır.
// Kullanım: node --experimental-strip-types scripts/x-paylas.ts [--adet 1] [--deneme]
// Anahtarlar yoksa ya da --deneme verilirse hiçbir şey göndermez, yalnızca gönderi metnini yazar.
// Gerekli ortam değişkenleri (X Developer Console > uygulama > Keys and tokens, "Read and write" izni):
//   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
// Not: X API kullandıkça ücretlidir (bağlantılı gönderi ~0,20 $). Günde 3 gönderi ≈ ayda 18 $.
import { createHmac, randomBytes } from "node:crypto";
import { q, kapat } from "../lib/db.ts";
import { gercekIndirimler, type IndirimSatiri } from "../lib/sorgular.ts";

const site = (process.env.SITE_URL ?? "https://fiyatdurbun.com").replace(/\/$/, "");
const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined; };
const adet = Math.max(1, Math.min(5, Number(arg("adet") ?? 1)));
const anahtar = {
  key: process.env.X_API_KEY, secret: process.env.X_API_SECRET,
  token: process.env.X_ACCESS_TOKEN, tokenSecret: process.env.X_ACCESS_SECRET,
};
const deneme = process.argv.includes("--deneme") || !anahtar.key || !anahtar.secret || !anahtar.token || !anahtar.tokenSecret;

const tl = (n: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(n));

/** Efsane Cuma / Kasım indirim dönemi: etiket eklenir. */
function etiket(): string {
  const d = new Date(Date.now() + 3 * 3600_000); // Türkiye saati
  const ay = d.getUTCMonth() + 1, gun = d.getUTCDate();
  return ay === 11 && gun >= 18 ? "\n\n#EfsaneCuma #GerçekİndirimMi" : "";
}

export function metin(u: IndirimSatiri): string {
  const ad = [u.marka, u.model, u.varyant].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const oran = Math.round(((u.med30 - u.fiyat) / u.med30) * 100);
  const adres = `${site}/urun/${u.slug}?utm_source=x&utm_medium=social&utm_campaign=gercek-indirim`;
  const govde = [
    `📉 ${ad.length > 90 ? ad.slice(0, 88) + "…" : ad}`,
    ``,
    `Şimdi ${tl(u.fiyat)} TL: son 30 günün en düşük fiyatı.`,
    `30 günlük ortanca ${tl(u.med30)} TL, yani gerçekten %${oran} aşağıda.`,
    u.magaza_sayisi > 1 ? `${u.magaza_sayisi} mağazanın fiyatı ve fiyat geçmişi:` : `Fiyat geçmişi:`,
    adres,
  ].join("\n");
  return govde + etiket();
}

// OAuth 1.0a (kullanıcı adına gönderi). JSON gövdesi imzaya girmez.
const yuzde = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
function yetki(yontem: string, url: string): string {
  const p: Record<string, string> = {
    oauth_consumer_key: anahtar.key!, oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1", oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: anahtar.token!, oauth_version: "1.0",
  };
  const taban = [yontem, yuzde(url), yuzde(Object.keys(p).sort().map((k) => `${yuzde(k)}=${yuzde(p[k])}`).join("&"))].join("&");
  p.oauth_signature = createHmac("sha1", `${yuzde(anahtar.secret!)}&${yuzde(anahtar.tokenSecret!)}`).update(taban).digest("base64");
  return "OAuth " + Object.keys(p).sort().map((k) => `${yuzde(k)}="${yuzde(p[k])}"`).join(", ");
}

async function gonder(text: string): Promise<string> {
  const url = "https://api.x.com/2/tweets";
  const r = await fetch(url, {
    method: "POST",
    headers: { authorization: yetki("POST", url), "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const govde = await r.text();
  if (!r.ok) throw new Error(`X ${r.status}: ${govde.slice(0, 300)}`);
  return JSON.parse(govde).data?.id ?? "";
}

await q(`create table if not exists x_paylasim (
  id serial primary key, urun_id int not null, fiyat numeric not null, tweet_id text, zaman timestamptz not null default now())`);

// Son 14 günde paylaşılan ürün, fiyatı en az %3 daha düşmediyse tekrar paylaşılmaz.
const onceki = await q<{ urun_id: number; fiyat: number }>(
  `select distinct on (urun_id) urun_id, fiyat::float8 fiyat from x_paylasim where zaman >= now() - interval '14 days' order by urun_id, zaman desc`);
const son = new Map(onceki.map((r) => [r.urun_id, r.fiyat]));
const adaylar = (await gercekIndirimler(60)).filter((u) => {
  const f = son.get(u.id);
  return f === undefined || u.fiyat <= f * 0.97;
});

if (!adaylar.length) console.log("Paylaşılacak doğrulanmış indirim yok; bu tur atlandı.");
for (const u of adaylar.slice(0, adet)) {
  const t = metin(u);
  if (deneme) { console.log("— DENEME (gönderilmedi) —\n" + t + "\n"); continue; }
  try {
    const id = await gonder(t);
    await q(`insert into x_paylasim (urun_id, fiyat, tweet_id) values ($1, $2, $3)`, [u.id, u.fiyat, id]);
    console.log(`Gönderildi: ${id} · ${u.slug}`);
  } catch (e) {
    console.error(String(e));
    process.exitCode = 1;
    break;
  }
}
await kapat();
process.exit(process.exitCode ?? 0);
