// Sunucudan erişim testi: her mağazada liste sayfası + 3 ürün sayfası okunur, sonuç tablo olarak yazılır.
// Çalıştırma: node --experimental-strip-types scripts/erisim-testi.ts
import { MAGAZALAR, urunLinkleri } from "../lib/toplayici/magazalar.ts";
import { getir, robotsAl } from "../lib/toplayici/istek.ts";
import { urunOku } from "../lib/toplayici/okuyucu.ts";
import { izinliMi } from "../lib/toplayici/robots.ts";

const sadece = process.argv[2];
const rapor: string[] = [];
const yaz = (s: string) => { console.log(s); rapor.push(s); };

for (const m of MAGAZALAR.filter((x) => !sadece || x.slug === sadece)) {
  yaz(`\n## ${m.ad}`);
  const robots = await robotsAl(m.site);
  yaz(`robots.txt: ${robots.kurallar.length} kural, ${robots.siteHaritalari.length} site haritası`);
  const liste = m.kategoriler["akilli-telefon"][0];
  yaz(`liste izni: ${izinliMi(robots, liste) ? "var" : "YOK"}`);
  const l = await getir(liste, m.bekleme);
  const linkler = l.html ? urunLinkleri(m, l.html) : [];
  yaz(`liste: HTTP ${l.durum}, ${Math.round(l.html.length / 1024)} KB, ${l.sure} ms, ${linkler.length} ürün linki${l.engel ? `, ENGEL: ${l.engel}` : ""}`);
  for (const u of linkler.slice(0, 3)) {
    const y = await getir(u, m.bekleme);
    const t = y.html ? urunOku(y.html, u) : null;
    yaz(`- HTTP ${y.durum} ${y.sure} ms${y.engel ? ` ENGEL: ${y.engel}` : ""} | ${t ? `${t.ad.slice(0, 60)} | ${t.fiyat} ${t.para} | barkod ${t.gtin ?? "-"} | stok ${t.stokta ? "var" : "yok"}${t.kargo != null ? ` | kargo ${t.kargo}` : ""}${t.satici ? ` | satıcı ${t.satici}` : ""}` : "ürün verisi okunamadı"} | ${u}`);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import("node:fs");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "# Erişim testi\n" + rapor.join("\n") + "\n");
}
