import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd.tsx";
import { kirintiJsonLd } from "@/lib/seo.ts";

export const metadata: Metadata = {
  title: "Kullanım Koşulları ve Sorumluluk",
  description: "Fiyat Dürbün satış yapmayan bir fiyat karşılaştırma sitesidir. Fiyat, stok ve mağaza bilgilerinin kaynağı, sorumluluk sınırları ve kaldırma talepleri.",
  alternates: { canonical: "/kullanim-kosullari" },
};

const GUNCELLEME = "13 Kasım 2026";

export default function KullanimKosullari() {
  return (
    <article className="kutu metin-sayfa" style={{ maxWidth: "72ch" }}>
      <JsonLd veri={kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Kullanım koşulları", yol: "/kullanim-kosullari" }])} />
      <h1>Kullanım koşulları</h1>
      <p className="soluk kucuk">Son güncelleme: {GUNCELLEME}</p>

      <h2>1. Hizmetin niteliği</h2>
      <p>Fiyat Dürbün (fiyatdurbun.com), Teknova Elektrik &amp; Otomasyon tarafından işletilen bir fiyat karşılaştırma ve yönlendirme hizmetidir.
        Sitede ürün satılmaz, sipariş ve ödeme alınmaz. “Mağazaya git” bağlantısı sizi ilgili mağazanın kendi sitesine yönlendirir;
        alışveriş, ödeme, teslimat, iade ve garanti işlemleri tamamen siz ile mağaza arasında, mağazanın kendi koşullarına göre gerçekleşir.</p>

      <h2>2. Bilgilerin kaynağı ve doğruluğu</h2>
      <p>Ürün adı, fiyat, stok, kargo, görsel ve mağaza bilgileri; mağazaların herkese açık sayfalarından ve yayımladıkları ürün listelerinden
        otomatik olarak alınır. Bu bilgiler mağazalar tarafından değiştirilebilir ve sitemize gecikmeli yansıyabilir; eşleştirme hataları olabilir.
        Fiyat Dürbün bu bilgilerin doğruluğunu, güncelliğini ve eksiksizliğini garanti etmez.
        <strong> Geçerli olan, satın alma anında mağaza sayfasında gösterilen bilgidir.</strong> Satın almadan önce fiyatı ve ürün özelliklerini mağazada kontrol ediniz.</p>

      <h2>3. Mağazalar hakkında</h2>
      <p>Sitede yer alan mağazalar Fiyat Dürbün'ün iş ortağı, temsilcisi ya da bayisi değildir. Mağaza ve ürün bilgileri mağazaların kendi
        sitelerinden okunur ve tarafımızca doğrulanmaz. Bir mağazanın sitede listelenmesi, o mağazanın güvenilir olduğuna dair bir beyan ya da tavsiye değildir.
        Mağazaların ürünleri, hizmetleri, yükümlülüklerini yerine getirip getirmemesi ve yasal sorumlulukları ilgili mağazaya aittir.</p>
      <p>Piyasanın belirgin biçimde altında kalan teklifleri “Dikkat” ibaresiyle işaretleyebilir, şüpheli bulduğumuz mağazaları önceden haber vermeksizin
        listeden çıkarabiliriz. Bu kontroller kullanıcıya kolaylık sağlamak içindir; bir mağazanın güvenilirliğine ilişkin güvence niteliği taşımaz.</p>

      <h2>4. Sorumluluğun sınırı</h2>
      <p>Fiyat Dürbün; mağazalarla yapılan alışverişlerden, mağaza sitelerindeki içerikten, yanlış ya da gecikmiş fiyat ve stok bilgisinden ve
        bunlara dayanılarak verilen kararlardan doğabilecek doğrudan veya dolaylı zararlardan, yürürlükteki mevzuatın izin verdiği ölçüde sorumlu değildir.
        Mağazalarla yaşanan uyuşmazlıklarda başvuru adresi ilgili mağaza, Tüketici Hakem Heyetleri ve Tüketici Mahkemeleridir.</p>

      <h2>5. Ortaklık bağlantıları</h2>
      <p>Bazı mağaza bağlantıları ortaklık (affiliate) bağlantısıdır; bu bağlantılar üzerinden yapılan alışverişlerden Fiyat Dürbün komisyon alabilir.
        Bu durum size ek maliyet getirmez ve fiyat sıralamasını etkilemez. Amazon Ortağı olarak, uygun alışverişlerden gelir elde ediyoruz.</p>

      <h2>6. Fiyat alarmları ve hesap</h2>
      <p>Fiyat alarmları bilgilendirme amaçlıdır; e-postaların zamanında ulaşacağı ya da bildirilen fiyatın mağazada hâlâ geçerli olacağı garanti edilmez.</p>

      <h2>7. Kaldırma ve düzeltme talepleri</h2>
      <p>Mağazanızın listeden çıkarılmasını, bir bilginin düzeltilmesini istiyorsanız ya da bir mağaza hakkında şikâyetiniz varsa
        <a href="mailto:info@teknovaelektrik.com"> info@teknovaelektrik.com</a> adresine yazabilirsiniz. Mağaza sahiplerinin kaldırma talepleri en kısa sürede uygulanır.
        Botumuzun sitenizi okumasını robots.txt ile de durdurabilirsiniz: <Link href="/bot">Botumuz hakkında</Link>.</p>

      <h2>8. Değişiklikler ve uygulanacak hukuk</h2>
      <p>Bu koşullar önceden bildirim yapılmaksızın güncellenebilir; güncel metin bu sayfada yayımlanır. Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir.</p>
    </article>
  );
}
