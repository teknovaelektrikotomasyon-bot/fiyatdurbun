// Toplayıcı: açık mağazaların site haritasından ürün linklerini bulur, her ürün sayfasını kibarca okur.
// Kullanım: node --experimental-strip-types scripts/topla.ts [--magaza pasaj] [--limit 20] [--cikti veri/okunan.jsonl] [--db]
//  --db: DATABASE_URL (ya da yerel PGlite) veritabanına da yazar.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { MAGAZALAR, linkleriCikar } from "../lib/toplayici/magazalar.ts";
import { getir } from "../lib/toplayici/istek.ts";
import { urunOku } from "../lib/toplayici/okuyucu.ts";
import { robotsAl } from "../lib/toplayici/istek.ts";
import { haritaAdresleri } from "../lib/toplayici/haritalar.ts";

const arg = (ad: string) => { const i = process.argv.indexOf("--" + ad); return i > 0 ? process.argv[i + 1] : undefined; };
const sadece = arg("magaza");
const limit = Number(arg("limit") ?? 0) || Infinity;
const cikti = arg("cikti") ?? "veri/okunan.jsonl";
const dbYaz = process.argv.includes("--db");
mkdirSync(dirname(cikti), { recursive: true });

const aktarim = dbYaz ? await import("../lib/aktarim.ts") : null;
if (aktarim) await aktarim.katalogHazirla();

const ozet: string[] = ["| Mağaza | Link | Okundu | Fiyatsız | Engel/hata |", "|---|---|---|---|---|"];
const gun = new Date().toISOString().slice(0, 10);

await Promise.all(MAGAZALAR.filter((m) => m.durum === "acik" && (!sadece || m.slug === sadece)).map(async (m) => {
  for (const [kategori, kesif] of Object.entries(m.kesif)) {
    if (kesif.tur === "ozel") {
      let teklifler: Awaited<ReturnType<typeof kesif.oku>> = [];
      try { teklifler = await kesif.oku(m.bekleme); } catch (e) { ozet.push(`| ${m.ad} | - | 0 | - | ${(e as Error).message} |`); continue; }
      for (const t of teklifler) {
        appendFileSync(cikti, JSON.stringify({ magaza: m.slug, kategori, gun, ...t }) + "\n");
        if (aktarim) await aktarim.kaydet(m.slug, kategori, t, gun);
        console.log(`${m.slug} ${t.fiyat} TL ${t.ad}`);
      }
      ozet.push(`| ${m.ad} | ${teklifler.length} | ${teklifler.length} | 0 | 0 |`);
      continue;
    }
    if (kesif.tur === "genel") {
      const robots = await robotsAl(m.site);
      const tumu = await haritaAdresleri(m.site, robots.siteHaritalari, kesif.filtre, 200000, m.bekleme);
      const gorulen = aktarim ? await aktarim.okunmusAdresler(m.slug) : new Map<string, number>();
      // Önce hiç okunmamış adresler (karışık sırayla), sonra en eski okunanlar.
      const yeni = tumu.filter((u) => !gorulen.has(u)).sort(() => Math.random() - 0.5);
      const eski = tumu.filter((u) => gorulen.has(u)).sort((a, b) => gorulen.get(a)! - gorulen.get(b)!);
      const secilen = [...yeni, ...eski].slice(0, Math.min(kesif.butce, limit));
      const say: Record<string, number> = {};
      let engel = 0;
      for (const url of secilen) {
        const y = await getir(url, m.bekleme);
        if (y.engel) {
          engel++;
          if (engel >= 5) { console.log(`${m.slug}: üst üste engel, durduruldu (${y.engel})`); break; }
          continue;
        }
        engel = 0;
        const t = urunOku(y.html, url);
        if (!t) { say.fiyatsiz = (say.fiyatsiz ?? 0) + 1; continue; }
        const kayit = { ...t, url }; // site haritasındaki adres (kademeli taramada "okundu" bilgisi bununla tutulur)
        appendFileSync(cikti, JSON.stringify({ magaza: m.slug, kategori, gun, ...kayit }) + "\n");
        const r = aktarim ? await aktarim.kaydetGenel(m.slug, kayit, kesif.kokler, gun) : { durum: "kuru" };
        say[r.durum] = (say[r.durum] ?? 0) + 1;
      }
      console.log(`${m.slug}: haritada ${tumu.length}, yeni ${yeni.length}, okunan ${secilen.length}`, say);
      ozet.push(`| ${m.ad} | ${tumu.length} (yeni ${yeni.length}) | ${say.kaydedildi ?? 0}${say.telefon ? ` +${say.telefon} tel` : ""} | ${say.fiyatsiz ?? 0} fiyatsız, ${say.kategorisiz ?? 0} kategorisiz | ${engel} |`);
      continue;
    }
    const kaynak = await getir(kesif.url, m.bekleme);
    if (kaynak.engel || !kaynak.html) { ozet.push(`| ${m.ad} | - | 0 | - | keşif: ${kaynak.engel ?? "boş"} |`); continue; }
    const linkler = linkleriCikar(kesif, kaynak.html, m.site).slice(0, limit);
    let okundu = 0, fiyatsiz = 0, engel = 0;
    for (const url of linkler) {
      const y = await getir(url, m.bekleme);
      if (y.engel) {
        engel++;
        console.log(`${m.slug} ENGEL ${y.engel} ${url}`);
        if (/HTTP 403|HTTP 429|bot/.test(y.engel) && engel >= 3) { console.log(`${m.slug}: üst üste engel, bu mağaza durduruldu`); break; }
        continue;
      }
      const t = urunOku(y.html, url);
      if (!t) { fiyatsiz++; continue; }
      const kayit = { ...t, ozellikHam: m.ozellikOku?.(y.html) };
      appendFileSync(cikti, JSON.stringify({ magaza: m.slug, kategori, gun, ...kayit }) + "\n");
      if (aktarim) await aktarim.kaydet(m.slug, kategori, kayit, gun);
      okundu++;
      console.log(`${m.slug} ${okundu}/${linkler.length} ${t.fiyat} TL ${t.ad.slice(0, 60)}`);
    }
    ozet.push(`| ${m.ad} | ${linkler.length} | ${okundu} | ${fiyatsiz} | ${engel} |`);
  }
}));

console.log(ozet.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, "# Toplama " + gun + "\n" + ozet.join("\n") + "\n");
if (aktarim) await (await import("../lib/db.ts")).kapat();
