// Site haritası: Google tek dosyada en çok 50.000 adres kabul eder. /sitemap.xml bir dizin (sitemap index);
// sayfalar ve ürünler ayrı dosyalarda, ürünler 20.000'lik parçalara bölünür.
import { q } from "@/lib/db";
import { siteAdresi } from "@/lib/eposta";

export const URUN_PARCA = 20_000;
export const site = () => siteAdresi().replace(/\/$/, "");

const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export type Adres = { url: string; son?: Date | string | null; siklik?: string; oncelik?: number };

export function urlset(adresler: Adres[]) {
  const govde = adresler.map((a) => `<url><loc>${kac(a.url)}</loc>${a.son ? `<lastmod>${new Date(a.son).toISOString()}</lastmod>` : ""}${a.siklik ? `<changefreq>${a.siklik}</changefreq>` : ""}${a.oncelik != null ? `<priority>${a.oncelik}</priority>` : ""}</url>`).join("\n");
  return xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${govde}\n</urlset>`);
}
export function dizin(adresler: string[]) {
  const simdi = new Date().toISOString();
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${adresler.map((a) => `<sitemap><loc>${kac(a)}</loc><lastmod>${simdi}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>`);
}
function xml(icerik: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${icerik}`, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=3600" },
  });
}

/** Stokta en az bir teklifi olan ürünler (gizlenen/stok dışı ürünler haritaya girmez). */
const URUN_SORGU = `select u.slug, max(t.guncelleme) as son from urun u join teklif t on t.urun_id = u.id
  where t.stokta group by u.id, u.slug`;
export async function urunSayisi() {
  return (await q<{ n: number }>(`select count(*)::int n from (${URUN_SORGU}) x`))[0]?.n ?? 0;
}
export async function urunParcasi(n: number) {
  return q<{ slug: string; son: Date | string | null }>(`${URUN_SORGU} order by u.id limit ${URUN_PARCA} offset ${n * URUN_PARCA}`);
}
