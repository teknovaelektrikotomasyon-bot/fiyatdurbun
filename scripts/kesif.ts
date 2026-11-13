// Otomatik mağaza keşfi: db/kaynak/aday-magazalar.txt'deki adayları dener, uygun olanları "inceleniyor" durumunda ekler.
// Koşullar: robots.txt izin veriyor, ana sayfa 403/bot koruması vermiyor, ürün site haritası var, örnek ürün
// sayfalarında schema.org TL fiyatı ve kategori yolu (breadcrumb) var. Firma bilgisi (unvan, vergi no, MERSİS,
// ETBİS bağlantısı) sitenin kendi sayfalarından okunur; hiçbiri bulunamazsa mağaza pasif eklenir (yayına çıkmaz).
// Korumayı aşmaya çalışmaz. Kullanım: node --experimental-strip-types scripts/kesif.ts [--db] [--yeniden] [--aday alan.com]
import { appendFileSync, readFileSync } from "node:fs";
import { getir, robotsAl } from "../lib/toplayici/istek.ts";
import { urunOku, decode, type OkunanTeklif } from "../lib/toplayici/okuyucu.ts";
import { feedBul, feedGetir, feedOku } from "../lib/toplayici/feed.ts";

// Bilinen dolandırıcılık vakası olan alan adları: hiçbir koşulda eklenmez.
const KARA_LISTE = new Set(["istanbulbilisim.com.tr"]);
const arg = (ad: string) => { const i = process.argv.indexOf("--" + ad); return i > 0 ? process.argv[i + 1] : undefined; };
const dbYaz = process.argv.includes("--db");
const yeniden = process.argv.includes("--yeniden");
const tek = arg("aday");

const adaylar = readFileSync("db/kaynak/aday-magazalar.txt", "utf8").split("\n")
  .map((s) => s.trim()).filter((s) => s && !s.startsWith("#"))
  .map((s) => { const [alan, tur] = s.split(/\s+/); return { alan: alan.replace(/^www\./, ""), tur: tur ?? "" }; })
  .filter((a) => !KARA_LISTE.has(a.alan))
  .filter((a) => !tek || tek.split(",").map((x) => x.trim().replace(/^www\./, "")).includes(a.alan));
// --feed: yeni aday denemez; mevcut otomatik mağazalarda yalnız ürün feed'i arar, bulup doğrularsa kaydeder.
const feedModu = process.argv.includes("--feed");

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
  direnc: "Direnc.net", robolinkmarket: "Robolink Market", gorsuelektronik: "Görsu Elektronik", samm: "SAMM Market", motorobit: "Motorobit", robocombo: "Robocombo", komponentci: "Komponentci", dermoeczanem: "Dermoeczanem", petfix: "PetFix", petza: "Petza", ozdilekteyim: "Özdilekteyim",
};
// Daha önce firma bilgisi yok diye pasif eklenenler uyarıyla yayına alınır (şüpheli fiyattan kapatılanlar hariç).
if (db) await db.q(`update magaza set aktif=true where kaynak='oto' and not aktif and durum <> 'kapali'
  and coalesce(guven_notu,'') not like '%yayından alındı%' and coalesce(guven_notu,'') like 'Otomatik keşif%'`);
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
  return { mersis, vergi, unvan, etbis, telefon, rakamlar: yazi.replace(/\D/g, "") };
}

function siteAdi(html: string, alan: string) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{2,40})["']/i)?.[1];
  const baslik = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1];
  const ad = og ?? baslik?.split(/\s[|\-–—:]\s/).map((s) => s.trim()).filter(Boolean).sort((a, b) => a.length - b.length)[0];
  const temiz = ad ? decode(ad).trim() : "";
  return temiz && temiz.length <= 40 && !/^(https?:|www\.)/i.test(temiz) && !/^(kitap|anasayfa|ana sayfa|home)$/i.test(temiz) ? temiz : alan.replace(/\.(com|net|gen)?\.?(tr)?$/, "");
}

/** Feed'deki fiyatlar mağazanın kendi sayfasıyla uyuşuyor mu? 3 örnekten en az 2'si %3 içinde olmalı
 *  (KDV hariç, eski ya da uydurma fiyatlı feed'ler böyle elenir). */
async function feedDogrula(urunler: OkunanTeklif[]) {
  const stokta = urunler.filter((u) => u.stokta);
  const ornek = [0.15, 0.5, 0.85].map((r) => stokta[Math.floor(stokta.length * r)]).filter(Boolean);
  let uyan = 0, yollu = 0;
  const notlar: string[] = [];
  for (const o of ornek) {
    if (o.kategoriYolu && o.kategoriYolu.length >= 2) yollu++;
    const y = await getir(o.url, 2000);
    if (y.engel || !y.html) { notlar.push("sayfa okunamadı"); continue; }
    const t = urunOku(y.html, o.url);
    if (!t) { notlar.push("sayfada fiyat yok"); continue; }
    const fark = Math.abs(t.fiyat - o.fiyat) / t.fiyat;
    if (fark <= 0.03) uyan++; else notlar.push(`feed ${o.fiyat} / sayfa ${t.fiyat}`);
  }
  return { tamam: uyan >= 2 && yollu >= 2, ozet: `${uyan}/${ornek.length} fiyat uyuştu, ${yollu}/${ornek.length} kategori yolu${notlar.length ? " (" + notlar.join("; ") + ")" : ""}` };
}

const satirlar = ["| Aday | Tür | Sonuç | Harita | Fiyat/yol | Firma | Not |", "|---|---|---|---|---|---|---|"];
const sonSonuc = new Map<string, string>(); // alan → son sonuç satırı (başvuru yanıtı için)
const yaz = (...h: (string | number)[]) => { const t = `| ${h.join(" | ")} |`; satirlar.push(t); console.log(t); sonSonuc.set(String(h[0]), `${h[2]}${h[4] && h[4] !== "-" ? ": " + h[4] : ""}${h[6] ? " (" + h[6] + ")" : ""}`); };
let eklenen = 0;

if (feedModu && db) {
  const oto = await db.q<{ slug: string; site: string; kesif: Record<string, unknown> | string }>("select slug, site, kesif from magaza where kaynak='oto' and aktif");
  let bulunan = 0;
  const hv = [...oto];
  await Promise.all(Array.from({ length: 6 }, async () => {
    for (let m = hv.shift(); m; m = hv.shift()) {
      try {
        const kesif = typeof m.kesif === "string" ? JSON.parse(m.kesif) : (m.kesif ?? {});
        const robots = await robotsAl(m.site);
        const f = await feedBul(m.site, robots.siteHaritalari);
        if (!f) { yaz(m.slug, "", "feed yok", "-", "-", "-", ""); continue; }
        const d = await feedDogrula(f.urunler);
        if (!d.tamam) { yaz(m.slug, "", "feed reddedildi", f.urunler.length, d.ozet, "-", f.url); continue; }
        await db!.q("update magaza set kesif=$2::jsonb where slug=$1 and kaynak='oto'", [m.slug, JSON.stringify({ ...kesif, feed: f.url })]);
        bulunan++;
        yaz(m.slug, "", "FEED EKLENDİ", f.urunler.length, d.ozet, "-", f.url);
      } catch (e) { yaz(m.slug, "", "hata", "-", "-", "-", (e as Error).message.slice(0, 80)); }
    }
  }));
  console.log(`Feed bulunan: ${bulunan}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `# Feed taraması\nFeed eklenen: ${bulunan}\n\n` + satirlar.join("\n") + "\n");
  await db.kapat();
  process.exit(0);
}

// --basvuru: "Mağazanızı ekleyin" formundan gelen bekleyen başvuruları işler, sonucu başvurana e-postayla bildirir.
if (process.argv.includes("--basvuru") && db) {
  const { basvuruTablosu } = await import("../lib/basvuru.ts");
  const { epostaGonder } = await import("../lib/eposta.ts");
  await basvuruTablosu();
  const bekleyen = await db.q<Basvuru & { tur: string }>("select id, unvan, vergi_no, mersis_no, feed, eposta, yetkili, site, tur from magaza_basvuru where durum='bekliyor' order by id limit 20");
  for (const b of bekleyen) {
    const alan = new URL(b.site).hostname.replace(/^www\./, "");
    let durum = "olmadi", sonuc = "";
    if (KARA_LISTE.has(alan)) { durum = "reddedildi"; sonuc = "kara liste"; }
    else if (mevcut.has(alan)) { durum = "eklendi"; sonuc = "Mağaza zaten listede."; }
    else {
      try { await dene({ alan, tur: b.tur, basvuru: b }); } catch (e) { yaz(alan, b.tur, "hata", "-", "-", "-", (e as Error).message.slice(0, 80)); }
      sonuc = sonSonuc.get(alan) ?? "sonuç yok";
      if (/^EKLENDİ/.test(sonuc)) durum = "eklendi";
    }
    await db.q("update magaza_basvuru set durum=$2, sonuc=$3, islenme=now() where id=$1", [b.id, durum, sonuc]);
    const NEDEN: [RegExp, string][] = [
      [/robots/, "Sitenizin robots.txt dosyası botumuzun sitenizi okumasına izin vermiyor. FiyatDurbunBot'a izin verirseniz yeniden başvurabilirsiniz."],
      [/kapalı|engel/, "Sitenize erişemedik ya da botumuz engellendi (403/CAPTCHA). Botumuza izin verirseniz yeniden başvurabilirsiniz."],
      [/firma bilgisi uyuşmadı/, "Başvurudaki vergi numarası ya da MERSİS numarası sitenizin iletişim, hakkımızda veya satış sözleşmesi sayfalarında bulunamadı. Bu bilgileri sitenize ekleyip yeniden başvurabilirsiniz."],
      [/fiyat okunamıyor|harita yok|kategori yolu/, "Ürün sayfalarınızdan fiyat ve kategori bilgisini okuyamadık. Cimri, Akakçe ya da Google Merchant XML feed adresinizi yazarak yeniden başvurabilirsiniz."],
    ];
    const metin = durum === "eklendi"
      ? `<p>Merhaba ${b.yetkili.replace(/[<>&"]/g, "")},</p><p>${b.site} Fiyat Dürbün'e eklendi. Ürünleriniz önümüzdeki toplama turlarında listelenmeye başlayacak.</p>`
      : `<p>Merhaba ${b.yetkili.replace(/[<>&"]/g, "")},</p><p>${b.site} için başvurunuzu şu an kabul edemedik.</p><p>${(NEDEN.find(([r]) => r.test(sonuc))?.[1]) ?? "Sitenizi otomatik olarak okuyamadık. Ayrıntı için bu e-postayı yanıtlayabilirsiniz."}</p>`;
    try { await epostaGonder(b.eposta, `Fiyat Dürbün başvurunuz: ${durum === "eklendi" ? "eklendi" : "sonuç"}`, metin + "<p>Fiyat Dürbün · Teknova Elektrik &amp; Otomasyon · info@teknovaelektrik.com</p>"); }
    catch (e) { console.log("e-posta:", (e as Error).message); }
    console.log(`başvuru #${b.id} ${alan}: ${durum} — ${sonuc}`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `# Mağaza başvuruları\n${bekleyen.length} başvuru işlendi\n\n` + satirlar.join("\n") + "\n");
  await db.kapat();
  process.exit(0);
}

// Adaylar 6'şar paralel denenir (her site kendi içinde yavaş ve aralıklı okunur).
const havuz = [...adaylar];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let a = havuz.shift(); a; a = havuz.shift()) {
    if (mevcut.has(a.alan)) { yaz(a.alan, a.tur, "zaten var", "-", "-", "-", ""); continue; }
    try { await dene(a); } catch (e) { yaz(a.alan, a.tur, "hata", "-", "-", "-", (e as Error).message.slice(0, 80)); }
  }
}));

type Basvuru = { id: number; unvan: string; vergi_no: string; mersis_no: string | null; feed: string | null; eposta: string; yetkili: string; site: string };
type Aday = { alan: string; tur: string; basvuru?: Basvuru };

async function dene(a: Aday) {
  const site = `https://www.${a.alan}`;
  let ana = await getir(site, 1500);
  let kok = site;
  if ((ana.durum === 0 && !ana.engel?.startsWith("robots")) || ana.durum >= 400) { const y = await getir(`https://${a.alan}`, 1500); if (!y.engel && y.durum < 400 && y.html) { ana = y; kok = `https://${a.alan}`; } }
  if (ana.engel || ana.durum >= 400 || !ana.html) return yaz(a.alan, a.tur, "kapalı", "-", "-", "-", ana.engel ?? `HTTP ${ana.durum}`);
  kok = new URL(kok).origin;
  const robots = await robotsAl(kok);
  // Önce herkese açık ürün feed'i: varsa ve fiyatları sayfayla uyuşuyorsa site haritası gerekmez.
  let feed = await (async () => {
    // Başvuruda verilen feed önce denenir
    if (!a.basvuru?.feed) return null;
    const f = await feedGetir(a.basvuru.feed, 120_000);
    if (f.engel || !f.xml) { yaz(a.alan, a.tur, "başvurudaki feed okunamadı", "-", "-", "-", f.engel ?? "boş"); return null; }
    const urunler = feedOku(f.xml, kok);
    return urunler.length >= 10 ? { url: a.basvuru.feed, urunler } : null;
  })();
  feed ??= await feedBul(kok, robots.siteHaritalari);
  if (feed) {
    const d = await feedDogrula(feed.urunler);
    if (d.tamam) return kaydetMagaza(a, kok, ana.html, { haritalar: [], dosyaFiltre: "", urlFiltre: `^https?://(www\\.)?${a.alan.replace(/\./g, "\\.")}/`, feed: feed.url },
      `feed ${feed.urunler.length}`, d.ozet, feed.urunler[0] ? `${feed.urunler[0].ad.slice(0, 40)} ${feed.urunler[0].fiyat} TRY` : "");
    yaz(a.alan, a.tur, "feed reddedildi, haritaya bakılıyor", feed.urunler.length, d.ozet, "-", feed.url);
  }
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

  // Ürün haritası dosya adları: "sitemap_products_3.xml" → products; tek dosyaysa tam adı.
  const dosyaFiltre = urunlu.length ? URUN_DOSYA.source : secili.map((l) => l.dosya.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const urlFiltre = `^https?://(www\\.)?${a.alan.replace(/\./g, "\\.")}/` + (kalipli ? `.*(${URUN_YOL.source.slice(1, -1)})` : "");
  return kaydetMagaza(a, kok, ana.html, { haritalar: kokler, dosyaFiltre, urlFiltre }, haritaOzet, `${fiyatli}/4, yol ${yollu}`, ornekAd);
}

async function kaydetMagaza(a: Aday, kok: string, anaHtml: string,
  yontem: { haritalar: string[]; dosyaFiltre: string; urlFiltre: string; feed?: string }, haritaOzet: string | number, okumaOzet: string, ornekAd: string) {
  const f = await firmaBilgisi(kok, anaHtml);
  if (a.basvuru) {
    // Başvuruda yazılan vergi no ya da MERSİS sitenin kendi sayfalarında geçmeli (başkası adına başvuruyu önler).
    const b = a.basvuru;
    const uyusma = f.rakamlar.includes(b.vergi_no) || Boolean(b.mersis_no && f.rakamlar.includes(b.mersis_no));
    if (!uyusma) return yaz(a.alan, a.tur, "firma bilgisi uyuşmadı", haritaOzet, okumaOzet, "-", "başvurudaki vergi no / MERSİS sitenin iletişim, hakkımızda ya da sözleşme sayfalarında bulunamadı");
    f.unvan = b.unvan; f.vergi = b.vergi_no; f.mersis = b.mersis_no ?? f.mersis;
  }
  // Firma bilgisi (vergi no, MERSİS, ETBİS; tanınmış markalarda unvan) bulunamayan mağaza da yayına çıkar ama ürün sayfasında
  // "Firma bilgisi bulunamadı" uyarısıyla gösterilir (karar: 2026-11-13). Şüpheli fiyat kontrolü ve kara liste geçerli.
  const kimlik = Boolean(f.mersis || f.vergi || f.etbis || (f.unvan && TANINMIS.has(a.alan)));
  const firmaOzet = [f.unvan && "unvan", f.vergi && "vergi", f.mersis && "MERSİS", f.etbis && "ETBİS"].filter(Boolean).join("+") || "yok";
  const kesif = { ...yontem, tur: a.tur, tarih: new Date().toISOString().slice(0, 10) };
  const etiketler = a.alan.split(".");
  const ilk = /^(market|magaza|shop|store|www)$/.test(etiketler[0]) ? etiketler[1] : etiketler[0]; // market.samm.com → samm
  const slug = ilk.replace(/[^a-z0-9-]/g, "") + (/\.gen\.tr$/.test(a.alan) ? "-gen" : "");
  const ad = ADLAR[slug] ?? siteAdi(anaHtml, a.alan);
  const not = `Otomatik keşif ${kesif.tarih}: ${yontem.feed ? "ürün feed'i, " : ""}${okumaOzet}. Firma: ${firmaOzet}${f.etbis ? " (ETBİS bağlantısı sitede var, doğrulanmadı)" : ""}.`;
  if (db) {
    await db.q(`insert into magaza (slug, ad, site, aktif, kaynak, kesif, unvan, vergi_no, mersis_no, telefon, guven_notu, durum)
                values ($1,$2,$3,$4,'oto',$5::jsonb,$6,$7,$8,$9,$10,'inceleniyor')
                on conflict (slug) do update set kesif=excluded.kesif, aktif=excluded.aktif, unvan=coalesce(magaza.unvan, excluded.unvan),
                  vergi_no=coalesce(magaza.vergi_no, excluded.vergi_no), mersis_no=coalesce(magaza.mersis_no, excluded.mersis_no),
                  telefon=coalesce(magaza.telefon, excluded.telefon), guven_notu=excluded.guven_notu
                where magaza.kaynak='oto'`,
      [slug, ad, kok, true, JSON.stringify(kesif), f.unvan ?? null, f.vergi ?? null, f.mersis ?? null, f.telefon ?? null, not]);
  }
  eklenen++;
  yaz(a.alan, a.tur, kimlik ? "EKLENDİ" : "EKLENDİ (firma bilgisi yok, uyarılı)", haritaOzet, okumaOzet, firmaOzet, `${ad} · ${ornekAd}`);
}

console.log(`Eklenen (aktif): ${eklenen}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `# Mağaza keşfi\nEklenen (aktif): ${eklenen}\n\n` + satirlar.join("\n") + "\n");
if (db) await db.kapat();
