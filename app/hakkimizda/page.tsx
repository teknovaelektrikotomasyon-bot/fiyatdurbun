import type { Metadata } from "next";
import Link from "next/link";
import { q1 } from "@/lib/db.ts";
import { JsonLd } from "@/components/JsonLd.tsx";
import { kirintiJsonLd, mutlak } from "@/lib/seo.ts";

export const metadata: Metadata = {
  title: "Hakkımızda: Fiyat Dürbün nedir, fiyatları nasıl topluyor?",
  description: "Fiyat Dürbün, Türkiye'deki çevrim içi mağazaların fiyatlarını karşılaştıran bağımsız bir sitedir. Fiyatların nasıl toplandığını, mağazaların nasıl kontrol edildiğini ve 30 günlük fiyat ölçeğini anlatıyoruz.",
  alternates: { canonical: "/hakkimizda" },
};
export const revalidate = 3600;

export default async function Hakkimizda() {
  const say = await q1<{ urun: number; magaza: number }>(
    "select (select count(distinct urun_id)::int from teklif where stokta) as urun, (select count(*)::int from magaza where aktif) as magaza").catch(() => undefined);
  return (
    <article className="kutu metin-sayfa" style={{ maxWidth: "72ch" }}>
      <JsonLd veri={{
        "@context": "https://schema.org", "@type": "AboutPage", name: "Fiyat Dürbün hakkında", url: mutlak("/hakkimizda"),
        about: { "@id": mutlak("/#organizasyon") },
      }} />
      <JsonLd veri={kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Hakkımızda", yol: "/hakkimizda" }])} />
      <h1>Fiyat Dürbün nedir?</h1>
      <p>Fiyat Dürbün, Türkiye'deki çevrim içi mağazaların fiyatlarını tek sayfada karşılaştıran bağımsız bir sitedir. Satış yapmıyoruz, ödeme almıyoruz; “Mağazaya git” düğmesi sizi doğrudan mağazanın kendi sayfasına götürür ve alışverişi orada yaparsınız.
        {say && say.urun > 0 && <> Şu anda {say.magaza} mağazadan {say.urun.toLocaleString("tr-TR")} ürünün güncel fiyatını izliyoruz.</>}</p>

      <h2>Fiyatları nasıl topluyoruz?</h2>
      <p>Botumuz mağazaların herkese açık ürün sayfalarını günde birkaç kez okur. Sitelerin arama motorları için yayımladığı ürün bilgisinden (fiyat, stok, barkod) yararlanır, robots.txt kurallarına uyar ve siteleri yormamak için istekleri aralıklı yapar. Bir site botlara kapalıysa ya da engelliyorsa o mağazayı listelemeyiz. Ayrıntılar: <Link href="/bot">Botumuz hakkında</Link>.</p>

      <h2>Dürbün ölçeği ne anlatır?</h2>
      <p>Her ürün sayfasındaki ölçek, bugünkü en ucuz fiyatın son 30 gündeki en düşük ve en yüksek fiyat arasında nerede durduğunu gösterir. “İndirim” yazan ama 30 gün önce de aynı fiyata satılan ürünleri böylece kolayca görürsünüz. Apple ve Samsung ürünlerinde aynı modelin Almanya, Fransa, İtalya, İspanya ve Hollanda'daki resmî fiyatını da Merkez Bankası kuruyla TL'ye çevirerek gösteriyoruz.</p>

      <h2>Mağazaları nasıl kontrol ediyoruz?</h2>
      <p>Büyük-küçük her mağazayı listeleyebiliriz ama önce kimliğine bakarız: ticari unvan, vergi ve MERSİS numarası, Ticaret Bakanlığı ETBİS kaydı. Bunları göstermeyen mağaza yayına alınmaz. Elle doğrulaması bitmeyen mağaza “Firma bilgisi kontrol ediliyor” etiketiyle görünür. Aynı ürünü satan diğer mağazaların yarısından ucuz teklifler “piyasanın çok altında” uyarısı alır ve en ucuz fiyat hesabına girmez; böyle teklifleri çok olan mağaza otomatik olarak listeden çıkar. Tüm liste: <Link href="/magazalar">Mağazalar ve güven kontrolü</Link>.</p>

      <h2>Fiyatlar her zaman doğru mu?</h2>
      <p>Fiyatlar mağazanın sayfasında okunduğu andaki hâlidir; mağaza fiyatı sonradan değiştirebilir, sepette ek indirim ya da kargo çıkabilir. Satın almadan önce mağazadaki son fiyatı kontrol edin. Hatalı bir fiyat ya da yanlış eşleşmiş bir ürün görürseniz bize bildirin; düzeltiriz.</p>
    </article>
  );
}
