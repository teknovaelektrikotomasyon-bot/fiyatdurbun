// Mağaza tanımları: nereden ürün linki bulunur, link nasıl tanınır.
// Fiyat okuma tüm mağazalarda ortak (okuyucu.ts); burada yalnız keşif bilgisi var.

export type MagazaTanimi = {
  slug: string;
  ad: string;
  site: string;
  kategoriler: Record<string, string[]>;   // bizim kategori slug'ı → mağazanın liste sayfaları
  urunLinki: RegExp;                         // liste sayfasındaki ürün linklerini yakalar (1. grup = yol)
  sayfa?: (url: string, n: number) => string; // sayfalama
  bekleme: number;                           // istekler arası en az bekleme (ms)
};

export const MAGAZALAR: MagazaTanimi[] = [
  {
    slug: "hepsiburada", ad: "Hepsiburada", site: "https://www.hepsiburada.com",
    kategoriler: { "akilli-telefon": ["https://www.hepsiburada.com/cep-telefonlari-c-371965"] },
    urunLinki: /href="(\/[a-z0-9-]+-p-[A-Z0-9]{8,})(?:[?"#])/g,
    sayfa: (u, n) => (n > 1 ? `${u}?sayfa=${n}` : u),
    bekleme: 4000,
  },
  {
    slug: "trendyol", ad: "Trendyol", site: "https://www.trendyol.com",
    kategoriler: { "akilli-telefon": ["https://www.trendyol.com/cep-telefonu-x-c103498"] },
    urunLinki: /href="(\/[a-z0-9-]+\/[a-z0-9-]+-p-\d+)(?:[?"#])/g,
    sayfa: (u, n) => (n > 1 ? `${u}?pi=${n}` : u),
    bekleme: 4000,
  },
  {
    slug: "teknosa", ad: "Teknosa", site: "https://www.teknosa.com",
    kategoriler: { "akilli-telefon": ["https://www.teknosa.com/cep-telefonu-c-100001"] },
    urunLinki: /href="(\/[a-z0-9-]+-p-\d+)(?:[?"#])/g,
    sayfa: (u, n) => (n > 1 ? `${u}?page=${n - 1}` : u),
    bekleme: 3000,
  },
  {
    slug: "vatan", ad: "Vatan Bilgisayar", site: "https://www.vatanbilgisayar.com",
    kategoriler: { "akilli-telefon": ["https://www.vatanbilgisayar.com/cep-telefonu-modelleri/"] },
    urunLinki: /href="(\/[a-z0-9-]+(?:telefon|iphone|galaxy|redmi|xiaomi)[a-z0-9-]*\.html)"/g,
    bekleme: 3000,
  },
  {
    slug: "mediamarkt", ad: "MediaMarkt", site: "https://www.mediamarkt.com.tr",
    kategoriler: { "akilli-telefon": ["https://www.mediamarkt.com.tr/tr/category/cep-telefonlari-504171.html"] },
    urunLinki: /href="(\/tr\/product\/[^"?#]+\.html)"/g,
    bekleme: 3000,
  },
];

export function urunLinkleri(m: MagazaTanimi, html: string) {
  const s = new Set<string>();
  for (const x of html.matchAll(m.urunLinki)) s.add(new URL(x[1], m.site).toString());
  return [...s];
}
