// Site haritalarından ürün adresleri: sitemap index'leri gezer, ürün haritalarını önceler.
import { getir } from "./istek.ts";

const HARITA_IPUCU = /(product|urun|prd|item)/i;

/** robots.txt'de ya da /sitemap.xml'de listelenen haritalardan, filtreye uyan adresler (en çok `sinir` adres). */
export async function haritaAdresleri(site: string, haritalar: string[], filtre: RegExp, sinir = 50000, bekleme = 1500, enCokDosya = 60): Promise<string[]> {
  const kuyruk = [...(haritalar.length ? haritalar : [new URL("/sitemap.xml", site).toString()])];
  const gorulen = new Set<string>();
  const sonuc = new Set<string>();
  for (let n = 0; n < enCokDosya && kuyruk.length && sonuc.size < sinir; n++) {
    kuyruk.sort((a, b) => Number(HARITA_IPUCU.test(b)) - Number(HARITA_IPUCU.test(a)));
    const h = kuyruk.shift()!;
    if (gorulen.has(h)) { n--; continue; }
    gorulen.add(h);
    const y = await getir(h, bekleme);
    if (y.engel || !y.html) continue;
    const locs = [...y.html.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(y.html)) { kuyruk.push(...locs.filter((l) => !/(image|video|blog|news|haber|category|kategori|brand|marka)/i.test(l))); continue; }
    for (const l of locs) if (filtre.test(l)) sonuc.add(l.replace(/^http:/, "https:"));
  }
  return [...sonuc].slice(0, sinir);
}
