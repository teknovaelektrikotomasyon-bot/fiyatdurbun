import type { MetadataRoute } from "next";
import { q } from "@/lib/db";
import { siteAdresi } from "@/lib/eposta";
import { agacSayilari, tumKategoriler } from "@/lib/katalog/agac.ts";
import { kategoriUrunSayilari } from "@/lib/sorgular.ts";

// Fiyatlar gün içinde değiştiği için her istekte veritabanından üretilir.
export const dynamic = "force-dynamic";

type Satir = { slug: string; son: Date | string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteAdresi();
  const simdi = new Date();

  // Ürünü olan kategoriler (alt kategoriler dahil sayılır); boş kategoriler noindex olduğu için haritaya girmez.
  const sayilar = agacSayilari(await kategoriUrunSayilari());
  const kategoriler = tumKategoriler().filter((k) => (sayilar.get(k.slug) ?? 0) > 0).map((k) => ({ slug: k.slug, son: null }));
  // Marka sayfaları ("Samsung Akıllı Telefon fiyatları"): yalnızca yaprak kategorilerde ve en az 2 ürünü olan markalar.
  const markaSayfalari = await q<{ kategori: string; marka: string }>(
    `select k.slug as kategori, lower(mk.ad) as marka from urun u join kategori k on k.id = u.kategori_id join marka mk on mk.id = u.marka_id
     where exists (select 1 from teklif t where t.urun_id = u.id and t.stokta)
     group by k.slug, lower(mk.ad) having count(*) >= 2`,
  );
  // Yalnızca en az bir mağazada fiyatı olan ürünler.
  const urunler = await q<Satir>(
    `select u.slug, max(t.guncelleme) as son
       from urun u
       join teklif t on t.urun_id = u.id
      group by u.slug
      order by son desc`,
  );

  const tarih = (s: Satir["son"]) => (s ? new Date(s) : simdi);

  return [
    { url: site, lastModified: simdi, changeFrequency: "hourly", priority: 1 },
    { url: `${site}/gercek-indirimler`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/magazalar`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${site}/hakkimizda`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site}/kullanim-kosullari`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/magazanizi-ekleyin`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/bot`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${site}/kategoriler`, changeFrequency: "weekly", priority: 0.6 },
    ...kategoriler.map((k) => ({
      url: `${site}/kategori/${k.slug}`,
      lastModified: simdi,
      changeFrequency: "hourly" as const,
      priority: 0.9,
    })),
    ...markaSayfalari.map((m) => ({
      url: `${site}/kategori/${m.kategori}?marka=${encodeURIComponent(m.marka)}`,
      lastModified: simdi,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...urunler.map((u) => ({
      url: `${site}/urun/${u.slug}`,
      lastModified: tarih(u.son),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
