// Kategori onarımı: eşleyici kuralları değiştikten sonra veritabanındaki ürünleri ham okumalara (veri dalındaki
// okunan/*.jsonl: mağaza kategori yolu + ürün adı) göre yeniden eşler.
// - Ürünü tek mağaza satıyorsa ve yeni eşleme farklıysa kategorisi güncellenir.
// - Yeni kurallarla hiçbir kategoriye girmeyen teklif (ör. telefon kılıfına düşmüş SMD kondansatör) silinir;
//   teklifi kalmayan ürün listelerde görünmez.
// Kullanım: node --experimental-strip-types scripts/kategori-onar.ts <okunan-klasörü> [--uygula]
import { readdirSync, readFileSync } from "node:fs";
import { q, kapat } from "../lib/db.ts";
import { kategoriEsle, kategoriyeAykiri } from "../lib/katalog/esle.ts";
import { tumKategoriler } from "../lib/katalog/agac.ts";
import { MAGAZALAR } from "../lib/toplayici/magazalar.ts";
import { TUR_KOK } from "../lib/toplayici/oto.ts";
import { katalogHazirla } from "../lib/aktarim.ts";

const klasor = process.argv[2];
const uygula = process.argv.includes("--uygula");
const TELEFON_MAGAZALARI = new Set(MAGAZALAR.filter((m) => !m.kesif.genel).map((m) => m.slug));

// Son okuma kazanır (dosyalar tarih sıralı).
const ham = new Map<string, { magaza: string; ad: string; yol?: string[] }>();
for (const f of readdirSync(klasor).filter((f) => f.endsWith(".jsonl")).sort()) {
  for (const l of readFileSync(`${klasor}/${f}`, "utf8").split("\n")) {
    if (!l.trim()) continue;
    try { const r = JSON.parse(l); if (r.url && r.ad) ham.set(r.url, { magaza: r.magaza, ad: r.ad, yol: r.kategoriYolu }); } catch { /* bozuk satır */ }
  }
}
console.log(`ham okuma: ${ham.size} adres`);

await katalogHazirla(); // yeni eklenen kategoriler veritabanında olsun

const kokler = new Map<string, string[]>();
for (const m of MAGAZALAR) { const g = m.kesif.genel; if (g?.tur === "genel") kokler.set(m.slug, g.kokler); }
for (const r of await q<{ slug: string; kesif: unknown }>("select slug, kesif from magaza where kaynak='oto' and kesif is not null")) {
  const k = (typeof r.kesif === "string" ? JSON.parse(r.kesif) : r.kesif) as { tur?: string; kokler?: string[] };
  kokler.set(r.slug, k.kokler ?? TUR_KOK[k.tur ?? ""] ?? []);
}
const otoMi = new Set((await q<{ slug: string }>("select slug from magaza where kaynak='oto'")).map((r) => r.slug));
const katId = new Map((await q<{ id: number; slug: string }>("select id, slug from kategori")).map((r) => [r.slug, r.id]));
const katSlug = new Map([...katId].map(([s, i]) => [i, s]));
const yolAdi = new Map(tumKategoriler().map((k) => [k.slug, k.ad]));

const teklifler = await q<{ id: number; url: string; magaza: string; urun_id: number; kategori_id: number; magaza_sayisi: number }>(`
  select t.id, t.url, m.slug magaza, t.urun_id, u.kategori_id,
    (select count(distinct t2.magaza_id)::int from teklif t2 where t2.urun_id=t.urun_id) magaza_sayisi
  from teklif t join magaza m on m.id=t.magaza_id join urun u on u.id=t.urun_id`);

async function teklifSil(t: { id: number; urun_id: number }) {
  await q("delete from eslesme_kuyrugu where teklif_id=$1", [t.id]);
  const tik = await q("select 1 from tiklama where teklif_id=$1 limit 1", [t.id]);
  if (tik.length) await q("update teklif set urun_id=null, stokta=false where id=$1", [t.id]);
  else { await q("delete from fiyat_gecmisi where urun_id=$1 and magaza_id=(select magaza_id from teklif where id=$2)", [t.urun_id, t.id]); await q("delete from teklif where id=$1", [t.id]); }
}

let tasinan = 0, silinen = 0, ayni = 0, hamYok = 0, cokMagazali = 0;
const ornek: string[] = [];
for (const t of teklifler) {
  if (TELEFON_MAGAZALARI.has(t.magaza)) continue;
  const h = ham.get(t.url);
  if (!h) {
    hamYok++;
    // Ham okuması yoksa en azından açıkça yanlış olanı ayıkla (adı bulunduğu bölümün yasak kelimesini taşıyor).
    const ad = (await q<{ ad: string }>("select ad from urun where id=$1", [t.urun_id]))[0]?.ad ?? "";
    if (t.magaza_sayisi === 1 && kategoriyeAykiri(katSlug.get(t.kategori_id)!, ad)) {
      const k = kokler.get(t.magaza) ?? [];
      const es = k.length ? kategoriEsle(undefined, ad, k) : null; // yalnız adla yeni yer
      if (es && katId.has(es.slug)) {
        if (ornek.length < 80) ornek.push(`TAŞI* ${t.magaza}: ${ad.slice(0, 50)} — ${yolAdi.get(katSlug.get(t.kategori_id)!)} → ${yolAdi.get(es.slug)}`);
        if (uygula) { try { await q("update urun set kategori_id=$2 where id=$1", [t.urun_id, katId.get(es.slug)]); } catch { await teklifSil(t); } }
        tasinan++;
      } else {
        if (ornek.length < 80) ornek.push(`SİL* ${t.magaza}: ${ad.slice(0, 50)} (${yolAdi.get(katSlug.get(t.kategori_id)!)})`);
        if (uygula) await teklifSil(t);
        silinen++;
      }
    }
    continue;
  }
  const k = kokler.get(t.magaza);
  if (!k?.length) continue;
  // Oto mağazalarda kategori yolu zorunlu (toplayıcıyla aynı kural)
  const es = otoMi.has(t.magaza) && !(h.yol && h.yol.length >= 2) ? null : kategoriEsle(h.yol, h.ad, k);
  const eski = katSlug.get(t.kategori_id)!;
  if (!es) {
    if (ornek.length < 60) ornek.push(`SİL  ${t.magaza}: ${h.ad.slice(0, 50)} (${yolAdi.get(eski)})`);
    if (uygula) await teklifSil(t);
    silinen++;
    continue;
  }
  if (es.slug === eski) { ayni++; continue; }
  if (t.magaza_sayisi > 1) { cokMagazali++; continue; }
  if (ornek.length < 60) ornek.push(`TAŞI ${t.magaza}: ${h.ad.slice(0, 50)} — ${yolAdi.get(eski)} → ${yolAdi.get(es.slug)}`);
  if (uygula) {
    try { await q("update urun set kategori_id=$2 where id=$1", [t.urun_id, katId.get(es.slug)]); }
    catch (e) { console.log("taşınamadı", t.urun_id, (e as Error).message.slice(0, 80)); continue; }
  }
  tasinan++;
}
console.log(ornek.join("\n"));
console.log(`\n${uygula ? "UYGULANDI" : "DENEME (değişiklik yok)"}: taşınan ${tasinan}, silinen teklif ${silinen}, aynı ${ayni}, çok mağazalı (dokunulmadı) ${cokMagazali}, ham okuması yok ${hamYok}`);
await kapat();
