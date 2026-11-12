// Samsung'un resmî ülke mağazaları (samsung.com/<ülke>/smartphones/...). Fiyatlar sayfadaki schema.org verisinden okunur:
// - Liste sayfası: ItemList → ürün ve "buy" sayfalarının adresleri.
// - "buy" sayfası: ProductGroup.hasVariant → her renk/hafıza için ad ("Galaxy S26 256GB | 12GB Black"), fiyat, stok, bağlantı.
// - Tekil ürün sayfası (A serisi): liste öğesindeki ad + fiyat; hafıza adresteki "-256gb-" parçasından.
// Yenilenmiş (Certified Re-Newed) ürünler ve stokta olmayan seçenekler alınmaz.
import { jsonLdNesneleri } from "../toplayici/okuyucu.ts";
import type { DisSatir } from "./ulkeler.ts";

const gb = (sayi: string, birim: string) => Number(sayi) * (birim.toLowerCase() === "tb" ? 1024 : 1);
const yenilenmis = (ad: string, url: string) => /re-?newed|refurb|reconditionn|ricondizionat|reacondicionad/i.test(ad) || /\/sm5[a-z]/i.test(url);
const tekSatir = (s: string) => s.replace(/\s+/g, " ").trim(); // bazı adlarda satır sonu var ("Galaxy Z\nFold8")
const mutlak = (u: string) => (u.startsWith("//") ? "https:" + u : u);

function enUcuzlar(satirlar: DisSatir[]) {
  const m = new Map<string, DisSatir>();
  for (const s of satirlar) {
    const k = `${s.model}|${s.depolamaGb}`;
    const v = m.get(k);
    if (!v || s.fiyat < v.fiyat) m.set(k, s);
  }
  return [...m.values()];
}

/** Liste sayfasından: okunacak "buy" sayfaları ve doğrudan fiyatı alınabilen tekil ürünler. */
export function samsungListeOku(html: string): { buySayfalari: string[]; tekiller: DisSatir[] } {
  const buy = new Set<string>();
  const tekiller: DisSatir[] = [];
  for (const o of jsonLdNesneleri(html)) {
    if (o["@type"] !== "Product" || typeof o.url !== "string" || typeof o.name !== "string") continue;
    const ad = tekSatir(o.name);
    const url = mutlak(o.url);
    if (yenilenmis(ad, url)) continue;
    if (/\/buy\/?(\?|$)/.test(url)) { buy.add(url.split("?")[0]); continue; }
    const teklif = o.offers as Record<string, unknown> | undefined;
    const fiyat = Number(teklif?.price);
    const hafiza = /-(\d+)(gb|tb)-sm-/i.exec(url);
    if (!hafiza || !fiyat || /OutOfStock/i.test(String(teklif?.availability ?? ""))) continue;
    tekiller.push({ marka: "Samsung", model: ad.replace(/\s*\(.*?\)\s*/g, " ").trim(), depolamaGb: gb(hafiza[1], hafiza[2]), fiyat, para: String(teklif?.priceCurrency ?? "EUR"), url, gorsel: typeof o.image === "string" ? mutlak(o.image) : undefined });
  }
  return { buySayfalari: [...buy], tekiller: enUcuzlar(tekiller) };
}

/** "buy" sayfasındaki seçenekler; model+hafıza başına stoktaki en ucuz renk. */
export function samsungBuyOku(html: string): DisSatir[] {
  const satirlar: DisSatir[] = [];
  for (const o of jsonLdNesneleri(html)) {
    if (o["@type"] !== "Product" || typeof o.sku !== "string" || typeof o.name !== "string") continue;
    const ad = tekSatir(o.name);
    const teklif = o.offers as Record<string, unknown> | undefined;
    const fiyat = Number(teklif?.price);
    // Ad biçimi: "<model> <hafıza>GB | <RAM>GB <renk>"; model, ilk hafıza ifadesinden önceki kısımdır.
    const m = /^(.*?)\s+(\d+)\s?(GB|TB)\b/i.exec(ad);
    if (!m || !fiyat || typeof teklif?.url !== "string") continue;
    if (/OutOfStock/i.test(String(teklif.availability ?? "")) || yenilenmis(ad, teklif.url)) continue;
    satirlar.push({ marka: "Samsung", model: m[1].trim(), depolamaGb: gb(m[2], m[3]), fiyat, para: String(teklif.priceCurrency ?? "EUR"), url: mutlak(teklif.url), gorsel: typeof o.image === "string" ? mutlak(o.image) : undefined });
  }
  return enUcuzlar(satirlar);
}
