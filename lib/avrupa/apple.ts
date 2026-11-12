// Apple'ın resmi ülke mağazalarından (apple.com/<ülke>/shop/buy-iphone/...) model ve hafızaya göre fiyat okur.
// Sayfa, seçim ekranının verisini PRODUCT_SELECTION_BOOTSTRAP içinde taşır: her renk/hafıza bir ürün, fiyatı displayValues.prices'ta.
// Çok ekran boyutlu sayfalarda (Pro / Pro Max) model adı boyut etiketinden, tek modelli sayfalarda Product JSON-LD'den alınır.
import { decode, jsonLdNesneleri } from "../toplayici/okuyucu.ts";

export type AppleFiyat = { model: string; depolamaGb: number; fiyat: number; para: string };

export { AVRUPA_ULKELERI as APPLE_ULKELERI } from "./ulkeler.ts";

/** Ülkenin iPhone satın alma sayfasındaki model sayfalarının adresleri. */
export function appleModelSayfalari(html: string, ulkeYol: string): string[] {
  const kalip = new RegExp(`(?:https://www\\.apple\\.com)?/${ulkeYol}/shop/buy-iphone/([a-z0-9-]+)`, "g");
  return [...new Set([...html.matchAll(kalip)].map((m) => `https://www.apple.com/${ulkeYol}/shop/buy-iphone/${m[1]}`))];
}

function dengeliJson(metin: string, bas: number) {
  let d = 0;
  let tirnak = false;
  for (let k = bas; k < metin.length; k++) {
    const c = metin[k];
    if (tirnak) { if (c === "\\") k++; else if (c === '"') tirnak = false; continue; }
    if (c === '"') tirnak = true;
    else if (c === "{") d++;
    else if (c === "}" && --d === 0) return metin.slice(bas, k + 1);
  }
  return null;
}

const gb = (s: string) => {
  const m = /^(\d+)(gb|tb)$/i.exec(s);
  return m ? Number(m[1]) * (m[2].toLowerCase() === "tb" ? 1024 : 1) : null;
};

const temizMetin = (html: string) => decode(html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")).replace(/\s+/g, " ").trim();

type Secim = {
  products: Record<string, string>[];
  displayValues: { prices: Record<string, { amountBeforeTradeIn?: number }>; dimensionScreensize?: Record<string, { value?: string }> };
};

/** Bir model sayfasındaki fiyatlar; aynı model+hafıza için renkler arasındaki en düşük fiyat. */
export function appleSayfaOku(html: string): AppleFiyat[] {
  const i = html.indexOf("productSelectionData:");
  if (i < 0) return [];
  const ham = dengeliJson(html, html.indexOf("{", i));
  if (!ham) return [];
  let veri: Secim;
  try { veri = JSON.parse(ham); } catch { return []; }

  const urunLd = jsonLdNesneleri(html).find((o) => o["@type"] === "Product");
  const tekAd = typeof urunLd?.name === "string" ? urunLd.name.trim() : null;
  const para = (() => {
    const o = (urunLd?.offers as Record<string, unknown>[] | undefined)?.[0];
    return typeof o?.priceCurrency === "string" ? o.priceCurrency : "EUR";
  })();
  const boyutAdi = (anahtar: string | undefined) => {
    if (!anahtar) return tekAd;
    const v = veri.displayValues.dimensionScreensize?.[anahtar]?.value;
    // Etiket "iPhone 18 Pro\n<span>6,3" Display</span>" biçiminde: ilk satır model adıdır.
    const ad = v ? temizMetin(v.split(/\n|<span/)[0]) : "";
    return ad || tekAd;
  };
  // Tek hafızalı modellerde (ör. iPhone 16) hafıza seçimi yoktur; hafıza, boyut etiketinde "128 GB" olarak yazar.
  const etiketHafizasi = (anahtar: string | undefined) => {
    const v = anahtar ? veri.displayValues.dimensionScreensize?.[anahtar]?.value : undefined;
    const bulunan = v ? [...temizMetin(v).matchAll(/(\d+)\s?(GB|TB)\b/gi)] : [];
    return bulunan.length === 1 ? gb(bulunan[0][1] + bulunan[0][2]) : null;
  };

  const enIyi = new Map<string, AppleFiyat>();
  for (const p of veri.products ?? []) {
    const depolamaGb = p.dimensionCapacity ? gb(p.dimensionCapacity) : etiketHafizasi(p.dimensionScreensize);
    const fiyat = veri.displayValues.prices?.[p.fullPrice]?.amountBeforeTradeIn;
    const model = boyutAdi(p.dimensionScreensize);
    if (!depolamaGb || !fiyat || !model) continue;
    const anahtar = `${model}|${depolamaGb}`;
    const var_ = enIyi.get(anahtar);
    if (!var_ || fiyat < var_.fiyat) enIyi.set(anahtar, { model, depolamaGb, fiyat, para });
  }
  return [...enIyi.values()];
}
