import type { Metadata } from "next";
import Link from "next/link";
import { FIRMA } from "@/lib/firma.ts";

export const metadata: Metadata = {
  title: "Gizlilik politikası ve KVKK aydınlatma metni",
  description: "Fiyat Dürbün'de hangi kişisel verilerin, hangi amaçla işlendiği, çerezler ve 6698 sayılı KVKK kapsamındaki haklarınız.",
  alternates: { canonical: "/gizlilik" },
};

export default function Gizlilik() {
  return (
    <article className="kutu metin-sayfa" style={{ maxWidth: "72ch" }}>
      <h1>Gizlilik politikası ve KVKK aydınlatma metni</h1>
      <p className="soluk kucuk">Son güncelleme: 13 Kasım 2026</p>

      <h2>Veri sorumlusu</h2>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu {FIRMA.unvan || FIRMA.ad}'dur ({FIRMA.adres || FIRMA.il}).
        İletişim: <a href={`mailto:${FIRMA.eposta}`}>{FIRMA.eposta}</a>. Ayrıntılı bilgiler için <Link href="/kunye">künye</Link>.</p>

      <h2>Hangi verileri işliyoruz?</h2>
      <ul>
        <li><b>Üyelik:</b> ad soyad, kullanıcı adı, e-posta adresi, şifrenin geri döndürülemez özeti (şifrenin kendisi saklanmaz), kayıt ve son giriş zamanı, onay tercihleri.</li>
        <li><b>Fiyat alarmı:</b> takip ettiğiniz ürünler, hedef fiyatlarınız ve size gönderilen bildirimler.</li>
        <li><b>Mağaza başvurusu:</b> şirket bilgileri ile yetkili kişinin adı, e-postası ve telefonu.</li>
        <li><b>Mağazaya yönlendirme:</b> “Mağazaya git” bağlantısına tıklandığında hangi teklife ve ne zaman tıklandığı (kim olduğunuz kaydedilmez).</li>
        <li><b>Sunucu kayıtları:</b> barındırma sağlayıcısının güvenlik ve hata takibi için tuttuğu teknik kayıtlar (IP adresi, tarayıcı bilgisi).</li>
      </ul>
      <p>Ziyaretçi takibi için reklam ya da analiz çerezi kullanmıyoruz.</p>

      <h2>Hangi amaçla ve hangi hukuki sebeple?</h2>
      <p>Verileriniz; hesabınızı oluşturmak ve yönetmek, fiyat alarmlarını göndermek, mağaza başvurularını değerlendirmek, siteyi güvenli ve çalışır tutmak
        ve yasal yükümlülükleri yerine getirmek amacıyla KVKK m.5/2-c (sözleşmenin kurulması ve ifası), m.5/2-ç (hukuki yükümlülük) ve m.5/2-f (meşru menfaat)
        hukuki sebeplerine dayanarak işlenir. Kampanya ve fırsat e-postaları yalnız açık onayınız (ileti izni) varsa gönderilir; onayınızı istediğiniz zaman geri alabilirsiniz.</p>

      <h2>Çerezler</h2>
      <p>Yalnızca oturumunuzu açık tutmak için zorunlu bir çerez (<code>fd_oturum</code>) kullanılır. “Beni hatırla” seçilirse 90 gün, seçilmezse tarayıcı kapanana kadar saklanır.
        “Mağazaya git” ile gittiğiniz mağaza siteleri ve ortaklık bağlantıları (örneğin Amazon, Admitad) kendi çerezlerini kendi politikalarına göre kullanabilir.</p>

      <h2>Verileri kimlerle paylaşıyoruz?</h2>
      <p>Verileriniz satılmaz ve pazarlama amacıyla üçüncü kişilere verilmez. Hizmetin çalışması için şu hizmet sağlayıcılarından yararlanılır:
        barındırma (Vercel), veritabanı (Supabase) ve e-posta gönderimi (Resend). Bu sağlayıcıların sunucuları yurt dışında bulunabileceğinden veriler,
        KVKK m.9'a uygun olarak bu sağlayıcılara aktarılabilir. Yasal zorunluluk hâlinde yetkili kamu kurumlarıyla paylaşılabilir.</p>

      <h2>Ne kadar süre saklıyoruz?</h2>
      <p>Hesap verileri hesabınız açık kaldığı sürece, hesabınızı silmenizden sonra en çok 1 yıl; mağaza başvuruları sonuçlandıktan sonra en çok 2 yıl;
        tıklama kayıtları en çok 2 yıl saklanır. Süre sonunda silinir ya da anonim hâle getirilir.</p>

      <h2>Haklarınız</h2>
      <p>KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini ya da silinmesini isteme, aktarıldığı kişileri öğrenme,
        itiraz etme ve zarara uğramanız hâlinde tazminat talep etme haklarınız vardır. Başvurularınızı <a href={`mailto:${FIRMA.eposta}`}>{FIRMA.eposta}</a> adresine
        iletebilirsiniz; en geç 30 gün içinde yanıtlanır. Hesabınızın silinmesini de aynı adresten isteyebilirsiniz.</p>
    </article>
  );
}
