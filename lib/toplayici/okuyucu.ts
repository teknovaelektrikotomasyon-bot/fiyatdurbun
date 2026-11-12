// Ürün sayfasından fiyatı okur. Önce sitenin Google için koyduğu schema.org Product verisine bakar;
// sayfa tasarımı değişse de bu veri genelde aynı kalır.

export type OkunanTeklif = {
  url: string;
  ad: string;
  marka?: string;
  gtin?: string;          // barkod (EAN/GTIN)
  mpn?: string;           // üretici parça kodu
  sku?: string;           // mağaza kodu
  fiyat: number;          // TL, KDV dahil
  para: string;
  stokta: boolean;
  kargo?: number;
  satici?: string;        // pazaryerinde satıcı adı
  renk?: string;
  gorsel?: string;
  kategoriYolu?: string[];
  puan?: number;
  yorumSayisi?: number;
};

const sayi = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  let s = String(v).trim().replace(/[^\d.,]/g, "");
  // 1.234,56 (TR) ya da 1,234.56 / 1234.56
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const metin = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "string") return decode(v).trim() || undefined;
  if (typeof v === "object" && v && "name" in v) return metin((v as { name: unknown }).name);
  return undefined;
};

export function decode(s: string) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;|&#39;/g, "'");
}

// Sayfadaki tüm JSON-LD bloklarını çözer, @graph ve iç içe yapılar dahil tüm nesneleri gezer.
export function jsonLdNesneleri(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let j: unknown;
    try { j = JSON.parse(m[1].trim()); } catch {
      try { j = JSON.parse(m[1].trim().replace(/[\u0000-\u001f]+/g, " ")); } catch { continue; }
    }
    const gez = (o: unknown) => {
      if (Array.isArray(o)) return o.forEach(gez);
      if (o && typeof o === "object") { out.push(o as Record<string, unknown>); Object.values(o).forEach(gez); }
    };
    gez(j);
  }
  return out;
}

const turMu = (o: Record<string, unknown>, t: string) => {
  const v = o["@type"];
  return Array.isArray(v) ? v.includes(t) : v === t;
};

export function urunOku(html: string, url: string): OkunanTeklif | null {
  const nesneler = jsonLdNesneleri(html);
  const p = nesneler.find((o) => turMu(o, "Product") && (o.offers || o.name));
  if (!p) return null;
  const teklifler = ([] as unknown[]).concat(p.offers ?? []) as Record<string, unknown>[];
  // AggregateOffer → lowPrice; birden çok Offer → en düşük fiyatlı stokta olan
  let secili: Record<string, unknown> | undefined;
  let fiyat: number | undefined;
  for (const t of teklifler.flatMap((t) => (t && turMu(t, "AggregateOffer") && t.offers ? ([] as unknown[]).concat(t.offers) as Record<string, unknown>[] : [t]))) {
    if (!t) continue;
    const f = sayi(t.price ?? t.lowPrice ?? (t.priceSpecification as Record<string, unknown> | undefined)?.price);
    if (f == null || f <= 0) continue;
    if (fiyat == null || f < fiyat) { fiyat = f; secili = t; }
  }
  if (fiyat == null || !secili) return null;
  const stok = String(secili.availability ?? "InStock");
  const kargoDeger = (secili.shippingDetails as Record<string, unknown> | undefined)?.shippingRate as Record<string, unknown> | undefined;
  const breadcrumb = nesneler.find((o) => turMu(o, "BreadcrumbList"));
  const kategoriYolu = breadcrumb
    ? (([] as unknown[]).concat(breadcrumb.itemListElement ?? []) as Record<string, unknown>[])
        .map((e) => metin(e.name) ?? metin((e.item as Record<string, unknown> | undefined)?.name)).filter((x): x is string => !!x)
    : undefined;
  const gorsel = (() => {
    const g = p.image as unknown;
    if (typeof g === "string") return g;
    if (Array.isArray(g)) return typeof g[0] === "string" ? g[0] : metin((g[0] as Record<string, unknown>)?.url) ?? undefined;
    if (g && typeof g === "object") { const c = (g as Record<string, unknown>).contentUrl ?? (g as Record<string, unknown>).url; return Array.isArray(c) ? String(c[0]) : c ? String(c) : undefined; }
    return undefined;
  })();
  const gtin = [p.gtin13, p.gtin, p.gtin12, p.gtin14, p.gtin8].map((x) => (x == null ? "" : String(x).replace(/\D/g, ""))).find((x) => x.length >= 8);
  const rating = p.aggregateRating as Record<string, unknown> | undefined;
  return {
    url: metin(secili.url) && /^https?:/.test(String(secili.url)) ? String(secili.url) : url,
    ad: metin(p.name) ?? "",
    marka: metin(p.brand) ?? metin(p.manufacturer),
    gtin,
    mpn: metin(p.mpn),
    sku: metin(p.sku),
    fiyat,
    para: String(secili.priceCurrency ?? "TRY"),
    stokta: !/OutOfStock|SoldOut|Discontinued/i.test(stok),
    kargo: sayi(kargoDeger?.value),
    satici: metin(secili.seller) ?? metin(secili.offeredBy),
    gorsel,
    renk: metin(p.color),
    kategoriYolu,
    puan: sayi(rating?.ratingValue),
    yorumSayisi: sayi(rating?.reviewCount ?? rating?.ratingCount),
  };
}
