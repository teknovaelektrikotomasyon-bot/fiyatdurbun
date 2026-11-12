import type { Metadata } from "next";
import Link from "next/link";
import { KATEGORI_AGACI, agacSayilari, tumKategoriler } from "@/lib/katalog/agac.ts";
import { kategoriUrunSayilari } from "@/lib/sorgular.ts";
import { JsonLd } from "@/components/JsonLd";
import { kirintiJsonLd } from "@/lib/seo.ts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tüm kategoriler", alternates: { canonical: "/kategoriler" }, description: "Fiyat Dürbün'deki tüm ürün kategorileri: elektronikten süpermarkete, mobilyadan el aletlerine." };

export default async function Kategoriler() {
  const sayilar = agacSayilari(await kategoriUrunSayilari());
  const n = (s: string) => sayilar.get(s) ?? 0;
  return (
    <>
      <JsonLd veri={kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Tüm kategoriler", yol: "/kategoriler" }])} />
      <nav className="yol" aria-label="Konum"><Link href="/">Ana sayfa</Link> / <span aria-current="page">Tüm kategoriler</span></nav>
      <div className="kat-ust">
        <div>
          <h1>Tüm kategoriler</h1>
          <p>{tumKategoriler().length} kategori. Fiyatı okunan kategoriler ürün sayısıyla gösterilir; diğerlerine mağazalar eklendikçe fiyat gelecek.</p>
        </div>
      </div>
      <nav className="kok-dizin" aria-label="Ana kategoriler">
        {KATEGORI_AGACI.map((k) => <a key={k.slug} href={`#${k.slug}`}>{k.ad}</a>)}
      </nav>
      <div className="dizin">
        {KATEGORI_AGACI.map((k) => (
          <section key={k.slug} id={k.slug} className="kutu dizin-kok">
            <h2><Link href={`/kategori/${k.slug}`}>{k.ad}</Link>{n(k.slug) > 0 && <span className="rozet yesil">{n(k.slug)} ürün</span>}</h2>
            <div className="dizin-sutunlar">
              {k.alt?.map((a) => (
                <div key={a.slug} className="dizin-grup">
                  <h3><Link href={`/kategori/${a.slug}`}>{a.ad}</Link></h3>
                  <ul>
                    {a.alt?.map((y) => (
                      <li key={y.slug}><Link href={`/kategori/${y.slug}`} className={n(y.slug) ? undefined : "yan-bos"}>{y.ad}</Link>{n(y.slug) > 0 && <span className="n">{n(y.slug)}</span>}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
