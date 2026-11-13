import type { Metadata } from "next";
import Link from "next/link";
import { q1 } from "@/lib/db.ts";
import { JsonLd } from "@/components/JsonLd.tsx";
import { kirintiJsonLd, mutlak } from "@/lib/seo.ts";

export const metadata: Metadata = {
  title: "Hakkımızda: Fiyat Dürbün nedir, fiyatları nasıl topluyor?",
  description: "Fiyat Dürbün, Türkiye'deki çevrim içi mağazaların fiyatlarını karşılaştıran bağımsız bir sitedir. Fiyatları nasıl topladığımızı, sahte indirimi nasıl yakaladığımızı ve nasıl gelir elde ettiğimizi anlatıyoruz.",
  alternates: { canonical: "/hakkimizda" },
};
export const revalidate = 3600;

const ADIMLAR = [
  { no: "1", baslik: "Fiyatları topluyoruz", metin: "Botumuz mağazaların herkese açık ürün sayfalarını günde birkaç kez okur. robots.txt kurallarına uyar, siteleri yormaz." },
  { no: "2", baslik: "Aynı ürünü eşleştiriyoruz", metin: "Model, hafıza ve renk gibi bilgilerden aynı ürünü farklı mağazalarda bulur, kargo dahil fiyata göre sıralarız." },
  { no: "3", baslik: "Siz karar verirsiniz", metin: "“Mağazaya git” sizi doğrudan mağazanın kendi sayfasına götürür. Alışverişi orada, mağazanın koşullarıyla yaparsınız." },
];

const KONTROLLER = [
  { baslik: "Sahte indirim kontrolü", metin: "Her üründe son 30 günün en düşük ve en yüksek fiyatını gösteririz. Önce artıp sonra “indirime” giren fiyat hemen görünür." },
  { baslik: "Şüpheli fiyat uyarısı", metin: "Diğer mağazaların yarısından ucuz bir teklif “piyasanın çok altında” uyarısı alır ve en ucuz fiyat hesabına girmez. Bu tür teklifleri çok olan mağaza listeden çıkar." },
  { baslik: "Avrupa ile karşılaştırma", metin: "Apple ve Samsung ürünlerinde aynı modelin Almanya, Fransa, İtalya, İspanya ve Hollanda'daki resmî fiyatını Merkez Bankası kuruyla TL'ye çeviririz." },
  { baslik: "Bağımsız sıralama", metin: "Sıralamayı yalnızca fiyat belirler. Hiçbir mağaza üste çıkmak için ödeme yapamaz." },
];

export default async function Hakkimizda() {
  const say = await q1<{ urun: number; magaza: number }>(
    "select (select count(distinct urun_id)::int from teklif where stokta) as urun, (select count(*)::int from magaza where aktif) as magaza").catch(() => undefined);
  return (
    <div className="bilgi">
      <JsonLd veri={{
        "@context": "https://schema.org", "@type": "AboutPage", name: "Fiyat Dürbün hakkında", url: mutlak("/hakkimizda"),
        about: { "@id": mutlak("/#organizasyon") },
      }} />
      <JsonLd veri={kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Hakkımızda", yol: "/hakkimizda" }])} />

      <header className="bilgi-bant">
        <p className="bilgi-ust">Hakkımızda</p>
        <h1>Aynı ürün, en uygun fiyat. Tek bakışta.</h1>
        <p className="bilgi-giris">Fiyat Dürbün, Türkiye'deki çevrim içi mağazaların fiyatlarını tek sayfada karşılaştıran bağımsız bir sitedir. Satış yapmıyoruz, ödeme almıyoruz. Size yalnızca nerede daha ucuz olduğunu ve fiyatın gerçekten indirimde olup olmadığını gösteriyoruz.</p>
        {say && say.urun > 0 && (
          <dl className="bilgi-sayilar">
            <div><dt>Mağaza</dt><dd className="sayi">{say.magaza.toLocaleString("tr-TR")}</dd></div>
            <div><dt>Ürün</dt><dd className="sayi">{say.urun.toLocaleString("tr-TR")}</dd></div>
            <div><dt>Fiyat geçmişi</dt><dd className="sayi">30 gün</dd></div>
          </dl>
        )}
      </header>

      <section className="bilgi-bolum">
        <h2>Nasıl çalışır?</h2>
        <ol className="bilgi-adimlar">
          {ADIMLAR.map((a) => (
            <li key={a.no} className="kutu"><span className="bilgi-no" aria-hidden="true">{a.no}</span><h3>{a.baslik}</h3><p>{a.metin}</p></li>
          ))}
        </ol>
        <p className="kucuk soluk">Botumuzun nasıl çalıştığı ve sitenizi okumasını nasıl durdurabileceğiniz: <Link href="/bot">Botumuz hakkında</Link>.</p>
      </section>

      <section className="bilgi-bolum">
        <h2>Sizin için neye bakıyoruz?</h2>
        <div className="bilgi-kartlar">
          {KONTROLLER.map((k) => (
            <div key={k.baslik} className="kutu"><h3>{k.baslik}</h3><p>{k.metin}</p></div>
          ))}
        </div>
      </section>

      <section className="bilgi-bolum bilgi-iki">
        <div className="kutu">
          <h2>Nasıl gelir elde ediyoruz?</h2>
          <p>Amazon Ortağı olarak, uygun alışverişlerden gelir elde ediyoruz. Bazı “Mağazaya git” ve “Amazon'da ara” bağlantıları ortaklık bağlantısıdır: bu bağlantıdan yapılan alışverişte mağaza bize küçük bir pay öder, sizin ödediğiniz fiyat değişmez. Bu ödemeler sıralamayı etkilemez.</p>
        </div>
        <div className="kutu">
          <h2>Fiyatlar her zaman doğru mu?</h2>
          <p>Fiyatlar mağazanın sayfasında okunduğu andaki hâlidir. Mağaza fiyatı sonradan değiştirebilir, sepette ek indirim ya da kargo çıkabilir. Geçerli olan mağaza sayfasındaki fiyattır. Hatalı bir fiyat ya da yanlış eşleşmiş bir ürün görürseniz <a href="mailto:info@teknovaelektrik.com">bize yazın</a>, düzeltelim.</p>
        </div>
      </section>

      <section className="bilgi-bolum">
        <h2>Sık sorulanlar</h2>
        <div className="kutu bilgi-sss">
          <details>
            <summary>Fiyat Dürbün'den ürün satın alabilir miyim?</summary>
            <p>Hayır. Biz yalnızca fiyatları karşılaştırırız. Sipariş, ödeme, teslimat, iade ve garanti tamamen mağaza ile sizin aranızdadır.</p>
          </details>
          <details>
            <summary>Listede olan her mağaza güvenilir mi?</summary>
            <p>Listede olmak bir güvence değildir. Şüpheli fiyat veren mağazaları otomatik olarak çıkarırız, ama alışverişten önce mağazayı tanımıyorsanız yorumlarına göz atmanızı öneririz. Ayrıntılar: <Link href="/kullanim-kosullari">Kullanım koşulları</Link>.</p>
          </details>
          <details>
            <summary>Mağazamı nasıl ekletebilirim?</summary>
            <p><Link href="/magazanizi-ekleyin">Mağazanızı ekleyin</Link> sayfasındaki formu doldurun. Siteniz uygunsa fiyatlarınız sitemizde görünmeye başlar. Listelenen tüm mağazalar: <Link href="/magazalar">Mağazalar</Link>.</p>
          </details>
          <details>
            <summary>Fiyat düşünce haber alabilir miyim?</summary>
            <p>Evet. Ürün sayfasında e-posta adresinizi bırakın, fiyat düştüğünde size yazalım.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
