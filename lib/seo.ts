// Arama motoru yardımcıları: kalıcı site adresi, başlık parçaları, yapısal veri (JSON-LD).
import { siteAdresi } from "./eposta.ts";

export const SITE_ADI = "Fiyat Dürbün";

/** Göreli yolu tam adrese çevirir (canonical, JSON-LD, site haritası için). */
export const mutlak = (yol: string) => new URL(yol, siteAdresi()).toString();

/** "Kasım 2026": başlıklarda güncellik işareti; arama sonucunda tıklanma oranını artırır. */
export const ayYil = (t = new Date()) => t.toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).replace(/^./, (h) => h.toLocaleUpperCase("tr"));

/** Türkçe büyük harf (İ/ı doğru). */
export const basHarfBuyuk = (s: string) => s.replace(/^./, (h) => h.toLocaleUpperCase("tr"));

/** Açıklama metinlerini arama sonucunda kesilmeyecek uzunlukta tutar. */
export function kirp(s: string, sinir = 158) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= sinir) return t;
  const kes = t.slice(0, sinir - 1);
  return kes.slice(0, kes.lastIndexOf(" ")).replace(/[,.;:]$/, "") + "…";
}

export type Kirinti = { ad: string; yol: string };

export function kirintiJsonLd(kirintilar: Kirinti[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: kirintilar.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: k.ad, item: mutlak(k.yol) })),
  };
}

export function organizasyonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": mutlak("/#organizasyon"),
    name: SITE_ADI,
    url: mutlak("/"),
    logo: mutlak("/logo.png"),
    description: "Türkiye'deki çevrim içi mağazaların fiyatlarını karşılaştıran, 30 günlük fiyat geçmişini ve Avrupa fiyatlarını gösteren bağımsız fiyat karşılaştırma sitesi.",
    foundingDate: "2026",
    areaServed: "TR",
    knowsLanguage: "tr",
    // Sosyal hesaplar açıldıkça buraya eklenir (Google'ın markayı tanıması için).
    sameAs: [] as string[],
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": mutlak("/#site"),
    name: SITE_ADI,
    alternateName: ["fiyatdurbun", "fiyatdurbun.com"],
    url: mutlak("/"),
    inLanguage: "tr-TR",
    publisher: { "@id": mutlak("/#organizasyon") },
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: mutlak("/ara") + "?q={search_term_string}" }, "query-input": "required name=search_term_string" },
  };
}

/** Sayfaya JSON-LD gömmek için güvenli metin (</script> kaçışı). */
export const jsonLdMetni = (veri: unknown) => JSON.stringify(veri).replace(/</g, "\\u003c");
