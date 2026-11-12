import type { MetadataRoute } from "next";
import { q } from "@/lib/db";
import { siteAdresi } from "@/lib/eposta";

// Fiyatlar gün içinde değiştiği için her istekte veritabanından üretilir.
export const dynamic = "force-dynamic";

type Satir = { slug: string; son: Date | string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteAdresi();
  const simdi = new Date();

  const kategoriler = await q<Satir>(
    `select k.slug, max(t.guncelleme) as son
       from kategori k
       join urun u on u.kategori_id = k.id
       join teklif t on t.urun_id = u.id
      group by k.slug`,
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
    { url: `${site}/magazalar`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${site}/bot`, changeFrequency: "monthly", priority: 0.2 },
    ...kategoriler.map((k) => ({
      url: `${site}/kategori/${k.slug}`,
      lastModified: tarih(k.son),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    })),
    ...urunler.map((u) => ({
      url: `${site}/urun/${u.slug}`,
      lastModified: tarih(u.son),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
