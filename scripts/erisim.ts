// Erişim testi: aday mağazaların botumuza açık olup olmadığını ve fiyatın okunabildiğini ölçer.
// Her aday için: robots.txt izni, ana sayfa yanıtı (403/meydan okuma), site haritasından ürün adresi, ürün sayfasında schema.org fiyatı.
// Korumayı aşmaya çalışmaz; engelleyen site "engelli" olarak raporlanır.
// Kullanım: node --experimental-strip-types scripts/erisim.ts
import { appendFileSync } from "node:fs";
import { getir, robotsAl } from "../lib/toplayici/istek.ts";
import { urunOku } from "../lib/toplayici/okuyucu.ts";

type Aday = { ad: string; site: string; tur: string; urunKalibi?: RegExp };
const ADAYLAR: Aday[] = [
  // Elektronik / bilgisayar
  { ad: "Teknosa", site: "https://www.teknosa.com", tur: "elektronik" },
  { ad: "Vatan", site: "https://www.vatanbilgisayar.com", tur: "elektronik" },
  { ad: "MediaMarkt", site: "https://www.mediamarkt.com.tr", tur: "elektronik" },
  { ad: "itopya", site: "https://www.itopya.com", tur: "bilgisayar" },
  { ad: "İncehesap", site: "https://www.incehesap.com", tur: "bilgisayar" },
  { ad: "Sinerji", site: "https://www.sinerji.gen.tr", tur: "bilgisayar" },
  { ad: "Gaming.gen.tr", site: "https://www.gaming.gen.tr", tur: "bilgisayar" },
  { ad: "Gürgençler", site: "https://www.gurgencler.com.tr", tur: "elektronik" },
  { ad: "Kliksa", site: "https://www.kliksa.com", tur: "elektronik" },
  { ad: "Teknostore", site: "https://www.teknostore.com", tur: "elektronik" },
  { ad: "Media Market Pttavm", site: "https://www.pttavm.com", tur: "pazaryeri" },
  { ad: "n11", site: "https://www.n11.com", tur: "pazaryeri" },
  { ad: "Pazarama", site: "https://www.pazarama.com", tur: "pazaryeri" },
  { ad: "Turkcell Pasaj", site: "https://www.turkcell.com.tr", tur: "telefon" },
  { ad: "Vodafone Online", site: "https://www.vodafone.com.tr", tur: "telefon" },
  { ad: "Türk Telekom", site: "https://www.turktelekom.com.tr", tur: "telefon" },
  { ad: "Dijitsu", site: "https://www.dijitsu.com.tr", tur: "elektronik" },
  // Beyaz eşya / ev
  { ad: "Arçelik", site: "https://www.arcelik.com.tr", tur: "beyaz-esya" },
  { ad: "Beko", site: "https://www.beko.com.tr", tur: "beyaz-esya" },
  { ad: "Vestel", site: "https://www.vestel.com.tr", tur: "beyaz-esya" },
  { ad: "Profilo", site: "https://www.profilo.com.tr", tur: "beyaz-esya" },
  { ad: "Bosch Ev", site: "https://www.bosch-home.com.tr", tur: "beyaz-esya" },
  { ad: "Siemens Ev", site: "https://www.siemens-home.bsh-group.com.tr", tur: "beyaz-esya" },
  { ad: "Karaca", site: "https://www.karaca.com", tur: "ev" },
  { ad: "English Home", site: "https://www.englishhome.com", tur: "ev" },
  { ad: "Madame Coco", site: "https://www.madamecoco.com", tur: "ev" },
  { ad: "Evidea", site: "https://www.evidea.com", tur: "ev" },
  { ad: "Paşabahçe", site: "https://www.pasabahce.com", tur: "ev" },
  { ad: "Tefal", site: "https://www.tefal.com.tr", tur: "ev" },
  // Mobilya
  { ad: "IKEA", site: "https://www.ikea.com.tr", tur: "mobilya" },
  { ad: "Vivense", site: "https://www.vivense.com", tur: "mobilya" },
  { ad: "İstikbal", site: "https://www.istikbal.com.tr", tur: "mobilya" },
  { ad: "Bellona", site: "https://www.bellona.com.tr", tur: "mobilya" },
  { ad: "Doğtaş", site: "https://www.dogtas.com", tur: "mobilya" },
  { ad: "Enza Home", site: "https://www.enzahome.com.tr", tur: "mobilya" },
  { ad: "Koleksiyon", site: "https://www.koleksiyon.com.tr", tur: "mobilya" },
  // Yapı market
  { ad: "Koçtaş", site: "https://www.koctas.com.tr", tur: "yapi-market" },
  { ad: "Bauhaus", site: "https://www.bauhaus.com.tr", tur: "yapi-market" },
  { ad: "Tekzen", site: "https://www.tekzen.com.tr", tur: "yapi-market" },
  { ad: "Hırdavatçı", site: "https://www.hirdavatci.com", tur: "yapi-market" },
  { ad: "Bosch Profesyonel TR", site: "https://www.bosch-professional.com", tur: "yapi-market" },
  // Market
  { ad: "Migros Sanal Market", site: "https://www.migros.com.tr", tur: "market" },
  { ad: "CarrefourSA", site: "https://www.carrefoursa.com", tur: "market" },
  { ad: "Macrocenter", site: "https://www.macrocenter.com.tr", tur: "market" },
  { ad: "A101", site: "https://www.a101.com.tr", tur: "market" },
  { ad: "Şok", site: "https://www.sokmarket.com.tr", tur: "market" },
  { ad: "Hakmar", site: "https://www.hakmarexpress.com.tr", tur: "market" },
  // Kozmetik
  { ad: "Gratis", site: "https://www.gratis.com", tur: "kozmetik" },
  { ad: "Watsons", site: "https://www.watsons.com.tr", tur: "kozmetik" },
  { ad: "Rossmann", site: "https://www.rossmann.com.tr", tur: "kozmetik" },
  { ad: "Sephora", site: "https://www.sephora.com.tr", tur: "kozmetik" },
  { ad: "Flormar", site: "https://www.flormar.com.tr", tur: "kozmetik" },
  // Spor / giyim
  { ad: "Decathlon", site: "https://www.decathlon.com.tr", tur: "spor" },
  { ad: "Boyner", site: "https://www.boyner.com.tr", tur: "giyim" },
  { ad: "Intersport", site: "https://www.intersport.com.tr", tur: "spor" },
  { ad: "Flo", site: "https://www.flo.com.tr", tur: "ayakkabi" },
  { ad: "Columbia TR", site: "https://www.columbia.com.tr", tur: "spor" },
  // Kitap / hobi / ofis
  { ad: "Kitapyurdu", site: "https://www.kitapyurdu.com", tur: "kitap" },
  { ad: "D&R", site: "https://www.dr.com.tr", tur: "kitap" },
  { ad: "BKM Kitap", site: "https://www.bkmkitap.com", tur: "kitap" },
  { ad: "Idefix", site: "https://www.idefix.com", tur: "kitap" },
  { ad: "Avansas", site: "https://www.avansas.com", tur: "ofis" },
  { ad: "Toyzz Shop", site: "https://www.toyzzshop.com", tur: "oyuncak" },
  // Anne-bebek / pet
  { ad: "e-bebek", site: "https://www.e-bebek.com", tur: "bebek" },
  { ad: "Joker", site: "https://www.joker.com.tr", tur: "bebek" },
  { ad: "Petlebi", site: "https://www.petlebi.com", tur: "pet" },
  { ad: "Pet Burada", site: "https://www.petburada.com", tur: "pet" },
  { ad: "Zoo Center", site: "https://www.zoocenter.com.tr", tur: "pet" },
  // Otomotiv
  { ad: "Otokoç Yedek", site: "https://www.lastikcim.com.tr", tur: "otomotiv" },
  { ad: "Lastik Sepeti", site: "https://www.lastiksepeti.com", tur: "otomotiv" },
  // Resmî marka mağazaları (Erol: olabilir)
  { ad: "Apple Türkiye", site: "https://www.apple.com/tr", tur: "resmi" },
  { ad: "Samsung Türkiye", site: "https://www.samsung.com/tr", tur: "resmi" },
  { ad: "Xiaomi Türkiye", site: "https://www.mi.com/tr", tur: "resmi" },
];

const URUN_IPUCU = /(product|urun|-p-|\/p\/|-pm-|prd|item|detay|\d{5,}(\.html)?$|\.html$)/i;
const SITEMAP_IPUCU = /(product|urun|prd|item)/i;

async function siteHaritasiUrunleri(site: string, haritalar: string[]): Promise<string[]> {
  const kuyruk = [...(haritalar.length ? haritalar : [new URL("/sitemap.xml", site).toString()])];
  const gorulen = new Set<string>();
  // En çok 4 harita dosyası okunur: önce adında "product" geçenler.
  for (let i = 0; i < 4 && kuyruk.length; i++) {
    kuyruk.sort((a, b) => Number(SITEMAP_IPUCU.test(b)) - Number(SITEMAP_IPUCU.test(a)));
    const h = kuyruk.shift()!;
    if (gorulen.has(h)) { i--; continue; }
    gorulen.add(h);
    const y = await getir(h, 1500);
    if (y.engel || !y.html) continue;
    const locs = [...y.html.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(y.html)) { kuyruk.push(...locs); i--; continue; }
    const urunler = locs.filter((u) => URUN_IPUCU.test(new URL(u).pathname) && !/\.(jpg|png|webp)$/i.test(u));
    if (urunler.length) return urunler;
  }
  return [];
}

const satirlar: string[] = ["| Aday | Tür | robots | Ana sayfa | Haritada ürün | Ürün sayfası | Fiyat | Örnek |", "|---|---|---|---|---|---|---|---|"];
for (const a of ADAYLAR) {
  const s = (...h: (string | number)[]) => { const t = `| ${a.ad} | ${a.tur} | ${h.join(" | ")} |`; satirlar.push(t); console.log(t); };
  const robots = await robotsAl(a.site);
  const kokYasak = robots.kurallar.some((k) => !k.izin && k.yol === "/") && !robots.kurallar.some((k) => k.izin && k.yol.length > 1);
  const ana = await getir(a.site, 1500);
  if (ana.engel || ana.durum >= 400) { s(kokYasak ? "kapalı" : "açık", `ENGEL ${ana.engel ?? ana.durum}`, "-", "-", "-", "-"); continue; }
  const urunler = await siteHaritasiUrunleri(a.site, robots.siteHaritalari);
  if (!urunler.length) { s(kokYasak ? "kapalı" : "açık", `${ana.durum}`, "0", "-", "-", "-"); continue; }
  // Haritanın başı genelde kategori olabilir; ortadan 3 aday dene.
  const denenecek = [urunler[Math.floor(urunler.length / 2)], urunler[Math.floor(urunler.length / 3)], urunler[urunler.length - 1]];
  let sonuc: { durum: string; fiyat: string; ornek: string } = { durum: "-", fiyat: "yok", ornek: denenecek[0] };
  for (const u of denenecek) {
    const y = await getir(u, 1500);
    if (y.engel) { sonuc = { durum: `ENGEL ${y.engel}`, fiyat: "-", ornek: u }; continue; }
    const t = urunOku(y.html, u);
    sonuc = { durum: String(y.durum), fiyat: t ? `${t.fiyat} ${t.para}` : "yok", ornek: t ? `${t.ad.slice(0, 40)} ${u}` : u };
    if (t) break;
  }
  s(kokYasak ? "kapalı" : "açık", `${ana.durum}`, urunler.length, sonuc.durum, sonuc.fiyat, sonuc.ornek.slice(0, 140));
}

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, "# Erişim testi\n" + satirlar.join("\n") + "\n");
