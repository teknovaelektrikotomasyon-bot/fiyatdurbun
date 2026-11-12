// Kategori ağacına erişim. Menüler ve kategori sayfaları ağacı koddan okur (veritabanı sorgusu gerekmez);
// veritabanındaki kategori tablosu katalogHazirla() ile bu ağaca eşitlenir ve ürünler oradaki id'ye bağlanır.
import { KATEGORI_AGACI, type KategoriDugumu } from "./agac-veri.ts";

export type { KategoriDugumu };
export { KATEGORI_AGACI };

export type DuzKategori = { ad: string; slug: string; g: number | null; ust: string | null; sira: number; derinlik: number };

const duz: DuzKategori[] = [];
const dugum = new Map<string, KategoriDugumu>();
const ustu = new Map<string, string | null>();
let sira = 0;
(function gez(liste: KategoriDugumu[], ust: string | null, derinlik: number) {
  for (const d of liste) {
    if (dugum.has(d.slug)) throw new Error(`Yinelenen kategori slug'ı: ${d.slug}`);
    dugum.set(d.slug, d);
    ustu.set(d.slug, ust);
    duz.push({ ad: d.ad, slug: d.slug, g: d.g, ust, sira: sira++, derinlik });
    if (d.alt) gez(d.alt, d.slug, derinlik + 1);
  }
})(KATEGORI_AGACI, null, 0);

/** Ağaç sırasıyla tüm kategoriler (önce üst, sonra altları). */
export const tumKategoriler = () => duz;

export const kategoriBul = (slug: string) => dugum.get(slug);

/** Kökten bu kategoriye kadar olan yol (kendisi dahil). */
export function kategoriYolu(slug: string): KategoriDugumu[] {
  const yol: KategoriDugumu[] = [];
  for (let s: string | null | undefined = slug; s; s = ustu.get(s)) {
    const d = dugum.get(s);
    if (d) yol.unshift(d);
  }
  return yol;
}

export const ustKategori = (slug: string) => {
  const u = ustu.get(slug);
  return u ? dugum.get(u) : undefined;
};

/** Kendisi ve tüm alt kategorilerinin slug'ları. */
export function altSluglar(slug: string): string[] {
  const d = dugum.get(slug);
  if (!d) return [];
  const sonuc: string[] = [];
  (function topla(x: KategoriDugumu) { sonuc.push(x.slug); x.alt?.forEach(topla); })(d);
  return sonuc;
}

export const yaprakMi = (slug: string) => !dugum.get(slug)?.alt?.length;

// Üst şeritte yer kazanmak için kök kategorilerin kısa adları.
const KISA: Record<string, string> = {
  "beyaz-esya-ev-aletleri": "Beyaz Eşya", "ev-dekorasyon-mutfak": "Ev ve Dekorasyon", "yapi-market-bahce": "Yapı Market",
  "anne-bebek-oyuncak": "Anne ve Bebek", "kozmetik-kisisel-bakim": "Kozmetik", "giyim-ayakkabi-aksesuar": "Giyim",
  "spor-ve-outdoor": "Spor", "otomotiv": "Otomotiv", "kitap-muzik-hobi": "Kitap ve Hobi", "ofis-kirtasiye": "Ofis",
};
export const kisaAd = (d: KategoriDugumu) => KISA[d.slug] ?? d.ad;

/** Kategori başına ürün sayısını alt kategorileri de toplayarak hesaplar. */
export function agacSayilari(yaprakSayilari: Map<string, number>) {
  const toplam = new Map<string, number>();
  (function say(liste: KategoriDugumu[]): number {
    let t = 0;
    for (const d of liste) { const n = (yaprakSayilari.get(d.slug) ?? 0) + (d.alt ? say(d.alt) : 0); toplam.set(d.slug, n); t += n; }
    return t;
  })(KATEGORI_AGACI);
  return toplam;
}
