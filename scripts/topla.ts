// Toplayıcı: açık mağazaların site haritasından ürün linklerini bulur, her ürün sayfasını kibarca okur.
// Kullanım: node --experimental-strip-types scripts/topla.ts [--magaza pasaj] [--limit 20] [--cikti veri/okunan.jsonl] [--db]
//  --db: DATABASE_URL (ya da yerel PGlite) veritabanına da yazar.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { MAGAZALAR, linkleriCikar, type MagazaTanimi } from "../lib/toplayici/magazalar.ts";
import { KATEGORI_AGACI } from "../lib/katalog/agac.ts";
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
// Bir mağaza en çok bu kadar süre okunur; robots.txt'de uzun bekleme isteyen siteler işi zaman aşımına sokmasın.
const SON_AN = Date.now() + Number(arg("dakika") ?? 40) * 60_000;

// Otomatik keşifle eklenen mağazalar (scripts/kesif.ts): veritabanındaki tanımdan genel mağaza olarak okunur.
// Tüm ana bölümlere eşlenebilirler ama kategori yolu (breadcrumb) olmayan ürün alınmaz.
// Mağaza türüne göre izinli ana bölümler (tümüne izin vermek "mobilyada mikser" gibi yanlış eşleşme doğurur).
const TUR_KOK: Record<string, string[]> = {
  elektronik: ["elektronik"], bilgisayar: ["elektronik"], telefon: ["elektronik"], aksesuar: ["elektronik"], robotik: ["elektronik", "kitap-muzik-hobi"],
  "ev-aletleri": ["beyaz-esya-ev-aletleri", "ev-dekorasyon-mutfak"], ev: ["ev-dekorasyon-mutfak", "mobilya"], mobilya: ["mobilya", "ev-dekorasyon-mutfak"],
  kozmetik: ["kozmetik-kisisel-bakim", "anne-bebek-oyuncak"], takviye: ["kozmetik-kisisel-bakim", "supermarket"], pet: ["pet-shop"],
  bebek: ["anne-bebek-oyuncak"], oyuncak: ["anne-bebek-oyuncak"], market: ["supermarket", "kozmetik-kisisel-bakim", "anne-bebek-oyuncak"],
  "yapi-market": ["yapi-market-bahce"], bahce: ["yapi-market-bahce"], kitap: ["kitap-muzik-hobi", "ofis-kirtasiye"], ofis: ["ofis-kirtasiye"],
  spor: ["spor-ve-outdoor", "giyim-ayakkabi-aksesuar"], otomotiv: ["otomotiv"],
};
const KOKLER = KATEGORI_AGACI.map((d) => d.slug);
type OtoKesif = { haritalar: string[]; dosyaFiltre: string; urlFiltre: string; tur?: string; kokler?: string[] };
const otoMagazalar: MagazaTanimi[] = [];
if (aktarim) {
  const { q } = await import("../lib/db.ts");
  try {
    const satir = await q<{ slug: string; ad: string; site: string; kesif: OtoKesif }>(
      "select slug, ad, site, kesif from magaza where kaynak='oto' and aktif and durum <> 'kapali' and kesif is not null");
    for (const r of satir) {
      // jsonb sürücüye göre metin olarak gelebilir
      if (typeof r.kesif === "string") r.kesif = JSON.parse(r.kesif);
      otoMagazalar.push({ slug: r.slug, ad: r.ad, site: r.site, durum: "acik", bekleme: 3000,
      kesif: { genel: { tur: "genel", filtre: new RegExp(r.kesif.urlFiltre), kokler: (r.kesif.kokler ?? TUR_KOK[r.kesif.tur ?? ""] ?? []).filter((k) => KOKLER.includes(k)), butce: Number(arg("oto-butce") ?? 400),
        haritalar: r.kesif.haritalar, dosyaFiltre: new RegExp(r.kesif.dosyaFiltre, "i"), yolZorunlu: true } } });
    }
    console.log(`otomatik mağaza: ${otoMagazalar.length}`, otoMagazalar.map((m) => `${m.slug}:${(m.kesif.genel as { kokler: string[] }).kokler.join("+")}`).join(" "));
  } catch (e) { console.log("otomatik mağazalar okunamadı:", (e as Error).message); }
}

await Promise.all([...MAGAZALAR, ...otoMagazalar].filter((m) => m.durum === "acik" && (!sadece || m.slug === sadece)).map(async (m) => {
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
      const tumu = await haritaAdresleri(m.site, kesif.haritalar ?? robots.siteHaritalari, kesif.filtre, 200000, m.bekleme, 60, kesif.dosyaFiltre);
      const gorulen = aktarim ? await aktarim.okunmusAdresler(m.slug) : new Map<string, number>();
      // Önce hiç okunmamış adresler (karışık sırayla), sonra en eski okunanlar.
      const yeni = tumu.filter((u) => !gorulen.has(u)).sort(() => Math.random() - 0.5);
      const eski = tumu.filter((u) => gorulen.has(u)).sort((a, b) => gorulen.get(a)! - gorulen.get(b)!);
      const secilen = [...yeni, ...eski].slice(0, Math.min(kesif.butce, limit));
      const say: Record<string, number> = {};
      let engel = 0;
      for (const url of secilen) {
        if (Date.now() > SON_AN) { console.log(`${m.slug}: süre doldu, kalanı sonraki tura`); break; }
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
        const r = aktarim ? await aktarim.kaydetGenel(m.slug, kayit, kesif.kokler, gun, kesif.yolZorunlu) : { durum: "kuru" };
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

// Dolandırıcılık ve yanlış eşleşmeye karşı: aynı ürünü en az 2 başka mağaza satarken onların medyanının yarısından
// ucuz olan teklif "şüpheli" işaretlenir; en ucuz fiyat hesabına girmez, sayfada uyarıyla en altta görünür.
// Otomatik eklenen bir mağazanın tekliflerinin %20'si (en az 5) şüpheliyse mağaza yayından alınır.
if (aktarim) {
  const { q } = await import("../lib/db.ts");
  try {
    await q(`with s as (
        select t.id, t.fiyat,
          (select percentile_cont(0.5) within group (order by t2.fiyat) from teklif t2 where t2.urun_id=t.urun_id and t2.stokta and t2.magaza_id<>t.magaza_id) med,
          (select count(distinct t2.magaza_id) from teklif t2 where t2.urun_id=t.urun_id and t2.stokta and t2.magaza_id<>t.magaza_id) n
        from teklif t where t.urun_id is not null)
      update teklif set supheli = (s.n >= 2 and s.fiyat < s.med * 0.5) from s
      where teklif.id = s.id and teklif.supheli is distinct from (s.n >= 2 and s.fiyat < s.med * 0.5)`);
    const kapanan = await q<{ slug: string; n: number; s: number }>(`update magaza m set aktif=false,
        guven_notu = coalesce(m.guven_notu,'') || ' | ' || current_date || ': tekliflerin çoğu piyasanın yarısından ucuz, yayından alındı.'
      from (select magaza_id, count(*) n, count(*) filter (where supheli) s from teklif group by magaza_id) x
      where x.magaza_id=m.id and m.kaynak='oto' and m.aktif and x.s >= 5 and x.s >= x.n * 0.2 returning m.slug, x.n::int, x.s::int`);
    for (const k of kapanan) ozet.push(`| ${k.slug} | YAYINDAN ALINDI | ${k.s}/${k.n} şüpheli fiyat | | |`);
  } catch (e) { console.log("şüpheli fiyat kontrolü:", (e as Error).message); }
}
console.log(ozet.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, "# Toplama " + gun + "\n" + ozet.join("\n") + "\n");
if (aktarim) await (await import("../lib/db.ts")).kapat();
