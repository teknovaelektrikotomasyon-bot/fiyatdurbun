// Otomatik mağaza keşfi: db/kaynak/aday-magazalar.txt'deki adayları dener, uygun olanları "inceleniyor" durumunda ekler.
// Koşullar: robots.txt izin veriyor, ana sayfa 403/bot koruması vermiyor, ürün site haritası var, örnek ürün
// sayfalarında schema.org TL fiyatı ve kategori yolu (breadcrumb) var. Firma bilgisi (unvan, vergi no, MERSİS,
// ETBİS bağlantısı) sitenin kendi sayfalarından okunur; hiçbiri bulunamazsa mağaza pasif eklenir (yayına çıkmaz).
// Korumayı aşmaya çalışmaz. Kullanım: node --experimental-strip-types scripts/kesif.ts [--db] [--yeniden] [--aday alan.com]
import { appendFileSync, readFileSync } from "node:fs";
import { getir, robotsAl } from "../lib/toplayici/istek.ts";
import { urunOku, decode } from "../lib/toplayici/okuyucu.ts";

const arg = (ad: string) => { const i = process.argv.indexOf("--" + ad); return i > 0 ? process.argv[i + 1] : undefined; };
const dbYaz = process.argv.includes("--db");
const yeniden = process.argv.includes("--yeniden");
const tek = arg("aday");

const adaylar = readFileSync("db/kaynak/aday-magazalar.txt", "utf8").split("\n")
  .map((s) => s.trim()).filter((s) => s && !s.startsWith("#"))
  .map((s) => { const [alan, tur] = s.split(/\s+/); return { alan: alan.replace(/^www\./, ""), tur: tur ?? "" }; })
  .filter((a) => !tek || a.alan === tek);

const db = dbYaz ? await import("../lib/db.ts") : null;
if (db) {
  // ALTER, sütun zaten varken bile tabloyu kilitlemeye çalışır ve süren toplama turunu bekleyip zaman aşımına düşer;
  // bu yüzden yalnız sütun gerçekten yoksa çalıştırılır.
  const sutunVar = async (t: string, c: string) => Boolean((await db!.q("select 1 from information_schema.columns where table_name=$1 and column_name=$2", [t, c])).length);
  if (!(await sutunVar("magaza", "kaynak"))) await db.q("alter table magaza add column kaynak text not null default 'elle'");
  if (!(await sutunVar("magaza", "kesif"))) await db.q("alter table magaza add column kesif jsonb");
  if (!(await sutunVar("teklif", "supheli"))) await db.q("alter table teklif add column supheli boolean not null default false");
}
// Sitenin kendi adı başlıktan düzgün çıkmayan mağazalar.
const ADLAR: Record<string, string> = {
  narecza: "Narecza", proteinocean: "Protein Ocean", bkmkitap: "BKM Kitap", casper: "Casper", mudo: "Mudo", ttec: "ttec",
  petzzshop: "Petzzshop", dermokozmetika: "Dermokozmetika", kozmela: "Kozmela", mamaciteyze: "Mamacı Teyze", flormar: "Flormar",
  intersport: "Intersport", fakir: "Fakir", "gaming-gen": "Gaming.gen.tr", akilliphone: "Akıllı Phone", robotistan: "Robotistan",
  direnc: "Direnc.net", robolinkmarket: "Robolink Market", motorobit: "Motorobit", robocombo: "Robocombo", komponentci: "Komponentci", dermoeczanem: "Dermoeczanem", petfix: "PetFix", petza: "Petza", ozdilekteyim: "Özdilekteyim",
};
if (db) for (const [slug, ad] of Object.entries(ADLAR)) await db.q("update magaza set ad=$2 where slug=$1 and kaynak='oto'", [slug, ad]);

const TANINMIS = new Set(["casper.com.tr", "evidea.com", "mudo.com.tr", "chakra.com.tr", "pasabahce.com", "kutahyaporselen.com",
  "tefal.com.tr", "fakir.com.tr", "flormar.com.tr", "gratis.com", "intersport.com.tr", "porland.com", "ttec.com.tr"]);
if (db && yeniden && !tek) await db.q("update magaza set aktif=false where kaynak='oto'"); // yeniden denemede herkes baştan sınanır

const mevcut = new Set<string>(db ? (await db.q<{ site: string }>("select site from magaza where kaynak <> 'oto' or not $1", [yeniden]))
  .map((r) => new URL(r.site).hostname.replace(/^www\./, "")) : []);

const URUN_DOSYA = /(product|urun|prd|item)/i;
const URUN_YOL = /(\/p\/|-p-|\/urun\/|\/product\/|\/products\/|-\d{4,}(\.html)?$|\.html$|_\d+$)/i;
const DEGIL = /\/(blog|kategori|category|categories|collections\/?$|marka|brand|etiket|tag|sayfa|page|haber|kampanya)(\/|$)/i;

type Leaf = { dosya: string; adresler: string[] };
/** robots'taki (ya da tahmini) haritaları gezer; ürün adresi içeren yaprak haritaları döner. */
async function yapraklar(site: string, haritalar: string[]): Promise<{ kokler: string[]; yaprak: Leaf[] }> {
  const kokler = haritalar.length ? haritalar.slice(0, 5) : ["/sitemap.xml", "/sitemap_index.xml", "/product-sitemap.xml"].map((y) => new URL(y, site).toString());
  const kuyruk = [...kokler];
  const gorulen = new Set<string>();
  const yaprak: Leaf[] = [];
  for (let n = 0; n < 14 && kuyruk.length; n++) {
    kuyruk.sort((a, b) => Number(URUN_DOSYA.test(b)) - Number(URUN_DOSYA.test(a)));
    const h = kuyruk.shift()!;
    if (gorulen.has(h)) { n--; continue; }
    gorulen.add(h);
    const y = await getir(h, 1500);
    if (y.engel || !y.html || y.durum >= 400) continue;
    const locs = [...y.html.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/g)].map((m) => decode(m[1]));
    if (/<sitemapindex/i.test(y.html)) { kuyruk.push(...locs.filter((l) => !/(image|video|blog|news|haber|category|kategori|brand|marka|page|sayfa)/i.test(l))); continue; }
    const adresler = locs.filter((u) => { try { const p = new URL(u).pathname; return p.length > 3 && !DEGIL.test(p) && !/\.(jpe?g|png|webp|pdf)$/i.test(p); } catch { return false; } });
    if (adresler.length >= 10) yaprak.push({ dosya: h, adresler });
    if (yaprak.some((l) => URUN_DOSYA.test(l.dosya)) && yaprak.length >= 2) break;
  }
  return { kokler, yaprak };
}

const metinAl = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

/** Firma bilgisi: ana sayfa alt kısmı + iletişim/hakkımızda/sözleşme sayfaları. */
async function firmaBilgisi(site: string, anaHtml: string) {
  const sayfalar = [anaHtml];
  const linkler = [...anaHtml.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1])
    .filter((h) => /(iletisim|hakkimizda|hakkinda|kurumsal|mesafeli|satis-sozlesme|contact|about|kunye|bilgilendirme)/i.test(h));
  for (const l of [...new Set(linkler)].slice(0, 3)) {
    try { const y = await getir(new URL(l, site).toString(), 1500); if (!y.engel && y.html) sayfalar.push(y.html); } catch { /* geçersiz link */ }
  }
  const tum = sayfalar.join(" ");
  const yazi = metinAl(tum);
  const mersis = yazi.match(/mers[iİı]s\s*(?:no|numaras[ıi])?\s*[:\-.]?\s*((?:\d\s?){16})/i)?.[1].replace(/\s/g, "");
  const vergi = yazi.match(/vergi\s*(?:no|numaras[ıi]|kimlik\s*no)\s*[:\-.]?\s*(\d{10,11})\b/i)?.[1];
  const unvan = (yazi.match(/(?:ticari\s*)?[üu]nvan[ıi]?\s*[:\-]\s*([^:]{5,120}?(?:A\.?\s?Ş\.?|LTD\.?\s*ŞT[İI]\.?|LİMİTED ŞİRKETİ|ANONİM ŞİRKETİ|Ltd\.?\s*Şti\.?))/i)?.[1]
    ?? yazi.match(/([A-ZÇĞİÖŞÜ0-9][A-ZÇĞİÖŞÜa-zçğıöşü0-9&.\- ]{3,90}?(?:A\.Ş\.|LTD\. ?ŞT[İI]\.|Ltd\. ?Şti\.|LİMİTED ŞİRKETİ|ANONİM ŞİRKETİ))/)?.[1])?.trim();
  const etbis = /etbis\.(?:eticaret|ticaret)\.gov\.tr/i.test(tum);
  const telefon = yazi.match(/(?:0\s?\(?850\)?|0\s?\(?[2-5]\d{2}\)?|444)\s?[\d\s]{7,10}/)?.[0].replace(/\s+/g, " ").trim();
  return { mersis, vergi, unvan, etbis, telefon };
}

function siteAdi(html: string, alan: string) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{2,40})["']/i)?.[1];
  const baslik = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1];
  const ad = og ?? baslik?.split(/\s[|\-–—:]\s/).map((s) => s.trim()).filter(Boolean).sort((a, b) => a.length - b.length)[0];
  const temiz = ad ? decode(ad).trim() : "";
  return temiz && temiz.length <= 40 && !/^(https?:|www\.)/i.test(temiz) && !/^(kitap|anasayfa|ana sayfa|home)$/i.test(temiz) ? temiz : alan.replace(/\.(com|net|gen)?\.?(tr)?$/, "");
}

const satirlar = ["| Aday | Tür | Sonuç | Harita | Fiyat/yol | Firma | Not |", "|---|---|---|---|---|---|---|"];
const yaz = (...h: (string | number)[]) => { const t = `| ${h.join(" | ")} |`; satirlar.push(t); console.log(t); };
let eklenen = 0;

// Adaylar 6'şar paralel denenir (her site kendi içinde yavaş ve aralıklı okunur).
const havuz = [...adaylar];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let a = havuz.shift(); a; a = havuz.shift()) {
    if (mevcut.has(a.alan)) { yaz(a.alan, a.tur, "zaten var", "-", "-", "-", ""); continue; }
    try { await dene(a); } catch (e) { yaz(a.alan, a.tur, "hata", "-", "-", "-", (e as Error).message.slice(0, 80)); }
  }
}));

async function dene(a: { alan: string; tur: string }) {
  const site = `https://www.${a.alan}`;
  let ana = await getir(site, 1500);
  let kok = site;
  if ((ana.durum === 0 && !ana.engel?.startsWith("robots")) || ana.durum >= 400) { const y = await getir(`https://${a.alan}`, 1500); if (!y.engel && y.durum < 400 && y.html) { ana = y; kok = `https://${a.alan}`; } }
  if (ana.engel || ana.durum >= 400 || !ana.html) return yaz(a.alan, a.tur, "kapalı", "-", "-", "-", ana.engel ?? `HTTP ${ana.durum}`);
  kok = new URL(kok).origin;
  const robots = await robotsAl(kok);
  const { kokler, yaprak } = await yapraklar(kok, robots.siteHaritalari);
  if (!yaprak.length) return yaz(a.alan, a.tur, "harita yok", "0", "-", "-", "");
  // Ürün adlı haritalar varsa onlar; yoksa en kalabalık yaprak.
  const urunlu = yaprak.filter((l) => URUN_DOSYA.test(l.dosya));
  const secili = urunlu.length ? urunlu : [yaprak.sort((x, y) => y.adresler.length - x.adresler.length)[0]];
  const havuzAdres = secili.flatMap((l) => l.adresler);
  const ipuclu = havuzAdres.filter((u) => URUN_YOL.test(new URL(u).pathname));
  // Adres kalıbı ürün haritasının çoğunu kapsamıyorsa kullanılmaz (yoksa kataloğun çoğu dışarıda kalır).
  const kalipli = ipuclu.length >= 10 && ipuclu.length >= havuzAdres.length * (urunlu.length ? 0.6 : 0.3);
  const kaynak = kalipli ? ipuclu : havuzAdres;
  const ornek = [0.2, 0.45, 0.7, 0.9].map((r) => kaynak[Math.floor(kaynak.length * r)]);
  let fiyatli = 0, yollu = 0, tl = 0, engel = 0;
  let ornekAd = "";
  for (const u of ornek) {
    const y = await getir(u, 2000);
    if (y.engel) { engel++; continue; }
    const t = urunOku(y.html, u);
    if (!t) continue;
    fiyatli++;
    if (/^(TRY|TL)$/i.test(t.para)) tl++;
    if (t.kategoriYolu && t.kategoriYolu.length >= 2) yollu++;
    ornekAd ||= `${t.ad.slice(0, 40)} ${t.fiyat} ${t.para}`;
  }
  const haritaOzet = `${havuzAdres.length}${urunlu.length ? " (ürün)" : ""}`;
  if (engel >= 2) return yaz(a.alan, a.tur, "ürün sayfası engelli", haritaOzet, `${fiyatli}/4`, "-", "");
  if (fiyatli < 2 || tl < 2) return yaz(a.alan, a.tur, "fiyat okunamıyor", haritaOzet, `${fiyatli}/4 fiyat, ${tl} TL`, "-", ornekAd);
  if (!yollu) return yaz(a.alan, a.tur, "kategori yolu yok", haritaOzet, `${fiyatli}/4, yol 0`, "-", ornekAd);

  const f = await firmaBilgisi(kok, ana.html);
  // Dolandırıcılığa karşı: yalnız unvan yazmak yetmez (kopyalanabilir); vergi no, MERSİS ya da ETBİS bağlantısı aranır.
  // Herkesin bildiği marka mağazalarında unvan yeterli. Diğerleri pasif eklenir, elle kontrol edilmeden yayına çıkmaz.
  const kimlik = Boolean(f.mersis || f.vergi || f.etbis || (f.unvan && TANINMIS.has(a.alan)));
  const firmaOzet = [f.unvan && "unvan", f.vergi && "vergi", f.mersis && "MERSİS", f.etbis && "ETBİS"].filter(Boolean).join("+") || "yok";
  // Ürün haritası dosya adları: "sitemap_products_3.xml" → products; tek dosyaysa tam adı.
  const dosyaFiltre = urunlu.length ? URUN_DOSYA.source : secili.map((l) => l.dosya.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const urlFiltre = `^https?://(www\\.)?${a.alan.replace(/\./g, "\\.")}/` + (kalipli ? `.*(${URUN_YOL.source.slice(1, -1)})` : "");
  const kesif = { haritalar: kokler, dosyaFiltre, urlFiltre, tur: a.tur, tarih: new Date().toISOString().slice(0, 10) };
  const slug = a.alan.split(".")[0].replace(/[^a-z0-9-]/g, "") + (/\.gen\.tr$/.test(a.alan) ? "-gen" : "");
  const ad = ADLAR[slug] ?? siteAdi(ana.html, a.alan);
  const not = `Otomatik keşif ${kesif.tarih}: ${fiyatli}/4 örnek fiyatlı, ${yollu}/4 kategori yolu. Firma: ${firmaOzet}${f.etbis ? " (ETBİS bağlantısı sitede var, doğrulanmadı)" : ""}.`;
  if (db) {
    await db.q(`insert into magaza (slug, ad, site, aktif, kaynak, kesif, unvan, vergi_no, mersis_no, telefon, guven_notu, durum)
                values ($1,$2,$3,$4,'oto',$5::jsonb,$6,$7,$8,$9,$10,'inceleniyor')
                on conflict (slug) do update set kesif=excluded.kesif, aktif=excluded.aktif, unvan=coalesce(magaza.unvan, excluded.unvan),
                  vergi_no=coalesce(magaza.vergi_no, excluded.vergi_no), mersis_no=coalesce(magaza.mersis_no, excluded.mersis_no),
                  telefon=coalesce(magaza.telefon, excluded.telefon), guven_notu=excluded.guven_notu
                where magaza.kaynak='oto'`,
      [slug, ad, kok, kimlik, JSON.stringify(kesif), f.unvan ?? null, f.vergi ?? null, f.mersis ?? null, f.telefon ?? null, not]);
  }
  if (kimlik) eklenen++;
  yaz(a.alan, a.tur, kimlik ? "EKLENDİ" : "eklendi (pasif, firma bilgisi yok)", haritaOzet, `${fiyatli}/4, yol ${yollu}`, firmaOzet, `${ad} · ${ornekAd}`);
}

console.log(`Eklenen (aktif): ${eklenen}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `# Mağaza keşfi\nEklenen (aktif): ${eklenen}\n\n` + satirlar.join("\n") + "\n");
if (db) await db.kapat();
