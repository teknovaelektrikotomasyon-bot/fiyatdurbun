import type { MetadataRoute } from "next";
import { siteAdresi } from "@/lib/eposta";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = siteAdresi();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Tıklama yönlendirmesi ve hesap sayfaları taranmasın. Sıralama varyantları aynı listenin kopyası olduğu için
        // taranmaz (tarama bütçesi ürün sayfalarına kalsın). Arama sonuçları taranabilir ama sayfada noindex var.
        disallow: ["/git/", "/hesabim", "/giris", "/*?*sirala="],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
