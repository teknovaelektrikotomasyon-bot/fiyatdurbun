// Mağaza iletişim e-postalarını toplar (tanıtım e-postası için): aday listesindeki ve veritabanındaki otomatik mağazaların
// ana sayfası + iletişim/hakkımızda sayfaları okunur (robots.txt'ye uyulur), aynı alan adındaki e-postalar seçilir.
// Çıktı: veri/iletisim.json (alan, eposta, kaynak sayfa). Kullanım: node --experimental-strip-types scripts/iletisim.ts [--db]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { getir } from "../lib/toplayici/istek.ts";
import { decode } from "../lib/toplayici/okuyucu.ts";

const BUYUK = /^(hepsiburada|trendyol|n11|amazon|pttavm|pazarama|ciceksepeti|teknosa|vatanbilgisayar|mediamarkt|migros|carrefoursa|a101|bim|sokmarket|apple|samsung|turkcell|vestel|arcelik|beko|ikea|decathlon|boyner|lcw|defacto|koton|mi|dyson|philips|lego|gratis|watsons|sephora|beymen|istanbulbilisim)\./;
const alanlar = new Set<string>();
for (const s of readFileSync("db/kaynak/aday-magazalar.txt", "utf8").split("\n")) {
  const a = s.trim().split(/\s+/)[0];
  if (a && !a.startsWith("#")) alanlar.add(a.replace(/^www\./, "").replace(/^(market|magaza|shop)\./, (m) => m));
}
if (process.argv.includes("--db")) {
  const { q, kapat } = await import("../lib/db.ts");
  for (const r of await q<{ site: string }>("select site from magaza where kaynak='oto'")) alanlar.add(new URL(r.site).hostname.replace(/^www\./, ""));
  await kapat();
}
const liste = [...alanlar].filter((a) => !BUYUK.test(a));
const KOTU = /(example|sentry|wixpress|domain\.com|email\.com|\.png|\.jpg|\.webp|\.gif|@2x|kvkk@|hukuk@|privacy@|noreply|no-reply|abuse@)/i;
const ONCELIK = ["info@", "iletisim@", "destek@", "satis@", "merhaba@", "hello@", "contact@", "musteri", "support@", "bilgi@"];

const sonuc: { alan: string; eposta: string | null; kaynak?: string; not?: string }[] = [];
const havuz = [...liste];
await Promise.all(Array.from({ length: 8 }, async () => {
  for (let alan = havuz.shift(); alan; alan = havuz.shift()) {
    const kok = `https://www.${alan}`;
    let ana = await getir(kok, 1500);
    let taban = kok;
    if (ana.engel || ana.durum >= 400 || !ana.html) { const y = await getir(`https://${alan}`, 1500); if (!y.engel && y.durum < 400 && y.html) { ana = y; taban = `https://${alan}`; } }
    if (ana.engel || !ana.html) { sonuc.push({ alan, eposta: null, not: ana.engel ?? `HTTP ${ana.durum}` }); continue; }
    const sayfalar: [string, string][] = [[taban, ana.html]];
    const linkler = [...ana.html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1])
      .filter((h) => /(iletisim|contact|hakkimizda|hakkinda|kurumsal|bize-ulasin|bizeulasin|kunye)/i.test(h));
    for (const l of [...new Set(linkler)].slice(0, 3)) {
      try { const u = new URL(l, taban).toString(); const y = await getir(u, 1500); if (!y.engel && y.html) sayfalar.push([u, y.html]); } catch { /* geçersiz link */ }
    }
    const bulunan = new Map<string, string>();
    const kokAd = alan.split(".").slice(-3).join(".");
    for (const [u, h] of sayfalar) {
      const metin = decode(h).replace(/\s*\[at\]\s*|\s*\(at\)\s*/gi, "@");
      for (const m of metin.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
        const e = m[0].toLowerCase().replace(/^mailto:/, "");
        if (KOTU.test(e)) continue;
        const ealan = e.split("@")[1];
        // Yalnız mağazanın kendi alan adındaki adresler (ya da alt alan adı); kişisel gmail vb. alınmaz.
        if (!(ealan === alan || alan.endsWith("." + ealan) || ealan.endsWith(kokAd) || kokAd.endsWith(ealan))) continue;
        if (!bulunan.has(e)) bulunan.set(e, u);
      }
    }
    const adaylar = [...bulunan.keys()].sort((a, b) => {
      const p = (x: string) => { const i = ONCELIK.findIndex((o) => x.startsWith(o) || x.includes(o)); return i < 0 ? 99 : i; };
      return p(a) - p(b);
    });
    sonuc.push(adaylar.length ? { alan, eposta: adaylar[0], kaynak: bulunan.get(adaylar[0]) } : { alan, eposta: null, not: "e-posta bulunamadı" });
    console.log(alan, adaylar[0] ?? "-");
  }
}));
mkdirSync("veri", { recursive: true });
writeFileSync("veri/iletisim.json", JSON.stringify(sonuc.sort((a, b) => a.alan.localeCompare(b.alan)), null, 1));
const bulunanSay = sonuc.filter((s) => s.eposta).length;
console.log(`TOPLAM ${sonuc.length}, e-posta bulunan ${bulunanSay}`);
console.log("JSON_BASLA" + JSON.stringify(sonuc) + "JSON_BITIR");
