// Mağaza tanımları: ürün linkleri nereden bulunur, teknik özellikler nasıl okunur.
// Fiyat okuma tüm mağazalarda ortak (okuyucu.ts, schema.org Product); burada yalnız mağazaya özgü bilgi var.

export type Kesif =
  | { tur: "sitemap"; url: string; filtre: RegExp }                 // site haritasından ürün linkleri
  | { tur: "liste"; url: string; urunLinki: RegExp; sayfa?: (u: string, n: number) => string }
  | { tur: "ozel"; oku: (bekleme: number) => Promise<OkunanTeklif[]> }  // sayfa başına çok seçenek (resmî mağazalar)
  // Genel mağaza: site haritasındaki ürünler, kategori kategori yolundan/addan bulunur. Her turda en çok `butce` sayfa
  // okunur: önce hiç okunmamışlar, sonra en eski fiyatlar (siteyi yormadan kataloğu birkaç günde tamamlar).
  | { tur: "genel"; filtre: RegExp; kokler: string[]; butce: number };

export type MagazaTanimi = {
  slug: string;
  ad: string;
  site: string;
  durum: "acik" | "engelli";             // engelli: sunucudan gelen botumuza 403 veriyor (2026-11-12 testi)
  kesif: Record<string, Kesif>;          // bizim kategori slug'ı → keşif yöntemi
  ozellikOku?: (html: string) => Record<string, string>; // sayfadaki teknik özellik tablosu
  bekleme: number;                       // aynı siteye istekler arası en az bekleme (ms)
};

import type { OkunanTeklif } from "./okuyucu.ts";
import { appleTurkiye, samsungTurkiye } from "./resmi.ts";

const temiz = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export const MAGAZALAR: MagazaTanimi[] = [
  {
    slug: "pasaj", ad: "Turkcell Pasaj", site: "https://www.turkcell.com.tr", durum: "acik",
    kesif: {
      "akilli-telefon": {
        tur: "sitemap", url: "https://www.turkcell.com.tr/sitemap-pasaj-devices.xml",
        filtre: /\/pasaj\/cep-telefonu\/(ios|android)-telefonlar\//,
      },
    },
    ozellikOku: (html) => {
      const o: Record<string, string> = {};
      const re = /features__title[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*features__text[^>]*>([\s\S]*?)<\/div>/g;
      for (const m of html.matchAll(re)) { const k = temiz(m[1]); if (k && !(k in o)) o[k] = temiz(m[2]); }
      return o;
    },
    bekleme: 3000,
  },
  {
    slug: "troyestore", ad: "Troy Estore", site: "https://www.troyestore.com", durum: "acik",
    kesif: {
      "akilli-telefon": {
        tur: "sitemap", url: "https://www.troyestore.com/sitemap-product.xml",
        filtre: /troyestore\.com\/iphone-\d+[a-z0-9-]*-\d+(gb|tb)[a-z0-9-]*_\d+$/,
      },
    },
    bekleme: 3000,
  },
  {
    slug: "apple-tr", ad: "Apple Türkiye", site: "https://www.apple.com/tr", durum: "acik",
    kesif: { "akilli-telefon": { tur: "ozel", oku: appleTurkiye } },
    bekleme: 3000,
  },
  {
    slug: "samsung-tr", ad: "Samsung Türkiye", site: "https://www.samsung.com/tr", durum: "acik",
    kesif: { "akilli-telefon": { tur: "ozel", oku: samsungTurkiye } },
    bekleme: 3000,
  },
  // --- Genel mağazalar (13 Kasım erişim testi: robots izinli, 403 yok, ürün sayfasında schema.org fiyatı var) ---
  { slug: "karaca", ad: "Karaca", site: "https://www.karaca.com", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /karaca\.com\/[^/]+-\d{5,}$|karaca\.com\/urun\//, kokler: ["ev-dekorasyon-mutfak", "beyaz-esya-ev-aletleri", "ofis-kirtasiye"], butce: 400 } } },
  { slug: "englishhome", ad: "English Home", site: "https://www.englishhome.com", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /englishhome\.com\/[a-z0-9-]+-\d{4,}$/, kokler: ["ev-dekorasyon-mutfak"], butce: 400 } } },
  { slug: "teknostore", ad: "Teknostore", site: "https://www.teknostore.com", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /teknostore\.com\/[a-z0-9-]+$/, kokler: ["elektronik", "beyaz-esya-ev-aletleri", "otomotiv"], butce: 400 } } },
  { slug: "migros", ad: "Migros", site: "https://www.migros.com.tr", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /migros\.com\.tr\/[a-z0-9-]+-p-[0-9a-f]+$/, kokler: ["supermarket", "kozmetik-kisisel-bakim", "anne-bebek-oyuncak", "pet-shop", "ev-dekorasyon-mutfak"], butce: 500 } } },
  { slug: "macrocenter", ad: "Macrocenter", site: "https://www.macrocenter.com.tr", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /macrocenter\.com\.tr\/[a-z0-9-]+-p-[0-9a-f]+$/, kokler: ["supermarket", "kozmetik-kisisel-bakim", "anne-bebek-oyuncak", "pet-shop", "ev-dekorasyon-mutfak"], butce: 500 } } },
  { slug: "rossmann", ad: "Rossmann", site: "https://www.rossmann.com.tr", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /rossmann\.com\.tr\/[a-z0-9-]+-p-[a-z0-9]+$/, kokler: ["kozmetik-kisisel-bakim", "anne-bebek-oyuncak", "ev-dekorasyon-mutfak", "supermarket"], butce: 500 } } },
  { slug: "joker", ad: "Joker", site: "https://www.joker.com.tr", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /joker\.com\.tr\/products\//, kokler: ["anne-bebek-oyuncak"], butce: 400 } } },
  { slug: "petburada", ad: "Pet Burada", site: "https://www.petburada.com", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /petburada\.com\/[a-z0-9-]+$/, kokler: ["pet-shop"], butce: 500 } } },
  { slug: "petlebi", ad: "Petlebi", site: "https://www.petlebi.com", durum: "acik", bekleme: 3000,
    kesif: { genel: { tur: "genel", filtre: /petlebi\.com\/[a-z0-9-]+\/[a-z0-9-]+\.html$|petlebi\.com\/urun\//, kokler: ["pet-shop"], butce: 500 } } },
  // Aşağıdakiler sunucudan 403 veriyor; korumayı aşmıyoruz. Satış ortaklığı beslemesi ya da izinle eklenecek.
  { slug: "hepsiburada", ad: "Hepsiburada", site: "https://www.hepsiburada.com", durum: "engelli", kesif: {}, bekleme: 4000 },
  { slug: "trendyol", ad: "Trendyol", site: "https://www.trendyol.com", durum: "engelli", kesif: {}, bekleme: 4000 },
  { slug: "teknosa", ad: "Teknosa", site: "https://www.teknosa.com", durum: "engelli", kesif: {}, bekleme: 3000 },
  { slug: "vatan", ad: "Vatan Bilgisayar", site: "https://www.vatanbilgisayar.com", durum: "engelli", kesif: {}, bekleme: 3000 },
  { slug: "mediamarkt", ad: "MediaMarkt", site: "https://www.mediamarkt.com.tr", durum: "engelli", kesif: {}, bekleme: 3000 },
];

export const magaza = (slug: string) => MAGAZALAR.find((m) => m.slug === slug);

export function linkleriCikar(k: Extract<Kesif, { tur: "sitemap" | "liste" }>, metin: string, site: string): string[] {
  const s = new Set<string>();
  if (k.tur === "sitemap") {
    for (const m of metin.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) if (k.filtre.test(m[1])) s.add(m[1].replace(/^http:/, "https:"));
  } else {
    for (const m of metin.matchAll(k.urunLinki)) s.add(new URL(m[1], site).toString());
  }
  return [...s];
}
