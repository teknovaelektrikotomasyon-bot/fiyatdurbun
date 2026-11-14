// IndexNow: Bing ve Yandex'e (Türkiye'de yaygın) değişen sayfaları anında bildirir. Google bu protokolü kullanmaz;
// Google için site haritası ve Search Console yeterlidir.
// Kullanım: node --experimental-strip-types scripts/indexnow.ts            (site haritasındaki tüm adresler)
//           node --experimental-strip-types scripts/indexnow.ts --son 8    (son 8 saatte fiyatı değişen ürünler)
import { readdirSync } from "node:fs";
import { q, kapat } from "../lib/db.ts";

const site = (process.env.SITE_URL ?? "https://fiyatdurbun.com").replace(/\/$/, "");
const anahtar = readdirSync("public").find((d) => /^[0-9a-f]{32}\.txt$/.test(d))?.replace(".txt", "");
if (!anahtar) throw new Error("public/ içinde IndexNow anahtar dosyası yok");

const i = process.argv.indexOf("--son");
let adresler: string[];
if (i > 0) {
  const saat = Number(process.argv[i + 1]) || 8;
  const r = await q<{ slug: string }>(`select distinct u.slug from urun u join teklif t on t.urun_id = u.id where t.guncelleme >= now() - ($1 || ' hours')::interval`, [String(saat)]);
  adresler = r.map((x) => `${site}/urun/${x.slug}`);
} else {
  // /sitemap.xml bir dizin: içindeki parça haritaları da okunur.
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const kok = await (await fetch(`${site}/sitemap.xml`)).text();
  adresler = [];
  if (/<sitemapindex/i.test(kok)) { for (const h of locs(kok)) adresler.push(...locs(await (await fetch(h)).text())); }
  else adresler = locs(kok);
}
await kapat();

for (let s = 0; s < adresler.length; s += 10000) {
  const parca = adresler.slice(s, s + 10000);
  // Bing ve Yandex'e ayrı ayrı gönderilir; biri reddederse diğeri yine alır.
  for (const uc of ["https://www.bing.com/indexnow", "https://yandex.com/indexnow"]) {
    const yanit = await fetch(uc, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(site).host, key: anahtar, keyLocation: `${site}/${anahtar}.txt`, urlList: parca }),
    });
    console.log(`IndexNow ${new URL(uc).host}: ${parca.length} adres → HTTP ${yanit.status} ${yanit.ok ? "" : (await yanit.text()).slice(0, 200)}`);
  }
}
