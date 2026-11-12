import { siteAdresi } from "@/lib/eposta";

// robots.txt elle yazılır: Yandex'e özel Clean-param yönergesi Next'in robots tipinde yok.
// Clean-param, sıralama/sayfa gibi parametreli adresleri Yandex'in tek sayfa olarak görmesini sağlar.
export const dynamic = "force-dynamic";

export function GET() {
  const site = siteAdresi().replace(/\/$/, "");
  const ortak = ["Allow: /", "Disallow: /git/", "Disallow: /hesabim", "Disallow: /giris", "Disallow: /*?*sirala="];
  const metin = [
    "User-agent: *", ...ortak, "",
    "User-agent: Yandex", ...ortak, "Clean-param: sirala /kategori/", "Clean-param: takip /urun/", "",
    `Sitemap: ${site}/sitemap.xml`, "",
  ].join("\n");
  return new Response(metin, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
