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
        // Tıklama yönlendirmesi, hesap ve arama sonuçları dizine girmesin.
        disallow: ["/git/", "/hesabim", "/giris", "/ara"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
