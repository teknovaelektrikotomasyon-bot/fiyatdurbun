import type { Metadata } from "next";
import Link from "next/link";
import { basvuruGonder } from "./islem";
import { BASVURU_TURLERI } from "@/lib/basvuru.ts";

export const metadata: Metadata = {
  title: "Mağazanızı ekleyin",
  description: "E-ticaret sitenizin ürünlerini Fiyat Dürbün'de listeleyin. Şirket bilgilerinizle başvurun; Cimri, Akakçe ya da Google Merchant XML feed'inizi kullanabilirsiniz.",
  alternates: { canonical: "/magazanizi-ekleyin" },
};

type P = { searchParams: Promise<{ gonderildi?: string; hata?: string }> };

const HATA: Record<string, string> = {
  tur: "Şirket türünü seçin.", unvan: "Ticari unvanı yazın.", vd: "Vergi dairesini yazın.",
  vergi: "Vergi numarası geçersiz (10 hane; şahıs şirketinde 11 haneli T.C. kimlik no).",
  mersis: "MERSİS numarası 16 hane olmalı (limited ve anonim şirketlerde zorunlu).",
  site: "Site adresi geçersiz.", urun: "Ne sattığınızı seçin.", feed: "Feed adresi http(s):// ile başlamalı.", yetkili: "Yetkili adını yazın.",
  eposta: "E-posta adresi geçersiz.", telefon: "Telefon numarası geçersiz.", onay: "Koşulları onaylamanız gerekiyor.",
  sinir: "Bu site ya da e-posta için bugün yeterince başvuru aldık; yarın tekrar deneyin.",
};

export default async function MagazaniziEkleyin({ searchParams }: P) {
  const sp = await searchParams;
  if (sp.gonderildi) return (
    <div className="kutu metin-sayfa" style={{ maxWidth: "60ch" }}>
      <h1>Başvurunuzu aldık</h1>
      <p>Sitenizi ve firma bilgilerinizi kontrol edip sonucu e-posta ile bildireceğiz. Teşekkür ederiz.</p>
      <p><Link href="/">Ana sayfaya dön</Link></p>
    </div>
  );
  const hatalar = (sp.hata ?? "").split(",").filter((h) => HATA[h]);
  return (
    <article className="kutu metin-sayfa basvuru" style={{ maxWidth: "72ch" }}>
      <h1>Mağazanızı ekleyin</h1>
      <p>Türkiye'de e-ticaret sitesi olan şirketler ürünlerini Fiyat Dürbün'de listeleyebilir. Başvuru ücretsizdir.
        Başvurular şirket adına yapılır; sitenizde ticari unvan, vergi ve MERSİS bilgilerinizin yer alması gerekir.</p>

      <h2>Nasıl işler?</h2>
      <ol>
        <li>Formu şirket bilgilerinizle doldurun.</li>
        <li>Sistemimiz sitenizi kontrol eder: sitenizdeki firma bilgileri başvurudakilerle uyuşmalı, ürün sayfalarınızda fiyat okunabilmeli.</li>
        <li>Uygunsa ürünleriniz günde birkaç kez güncellenerek listelenir; sonucu e-posta ile bildiririz.</li>
      </ol>
      <p className="kucuk soluk">En hızlı yol ürün feed'idir: Cimri, Akakçe ya da Google Merchant için hazırladığınız XML adresini aşağıya yazmanız yeterli.
        Feed yoksa ürün sayfalarınızdaki schema.org ürün bilgisi ve site haritanız kullanılır.</p>

      {hatalar.length > 0 && <div className="hata-kutu" role="alert">{hatalar.map((h) => <p key={h}>{HATA[h]}</p>)}</div>}

      <form action={basvuruGonder} className="form-izgara">
        <fieldset>
          <legend>Şirket</legend>
          <label>Şirket türü
            <select name="sirket_turu" required defaultValue="">
              <option value="" disabled>Seçin</option>
              <option value="sahis">Şahıs şirketi</option>
              <option value="limited">Limited şirket</option>
              <option value="anonim">Anonim şirket</option>
              <option value="diger">Diğer</option>
            </select>
          </label>
          <label>Ticari unvan<input name="unvan" required maxLength={200} autoComplete="organization" /></label>
          <label>Vergi dairesi<input name="vergi_dairesi" required maxLength={80} /></label>
          <label>Vergi no / T.C. kimlik no<input name="vergi_no" required inputMode="numeric" maxLength={11} /></label>
          <label>MERSİS no <span className="soluk kucuk">(limited ve anonimde zorunlu)</span><input name="mersis_no" inputMode="numeric" maxLength={19} /></label>
          <label>ETBİS kaydınız var mı?
            <select name="etbis" defaultValue="evet"><option value="evet">Evet</option><option value="hayir">Hayır</option></select>
          </label>
        </fieldset>
        <fieldset>
          <legend>Site</legend>
          <label>Ağırlıklı olarak ne satıyorsunuz?
            <select name="tur" required defaultValue="">
              <option value="" disabled>Seçin</option>
              {BASVURU_TURLERI.map(([d, ad]) => <option key={d} value={d}>{ad}</option>)}
            </select>
          </label>
          <label>E-ticaret site adresi<input name="site" required placeholder="www.magazaniz.com" maxLength={120} /></label>
          <label>Ürün feed adresi (XML) <span className="soluk kucuk">(isteğe bağlı)</span><input name="feed" placeholder="https://www.magazaniz.com/cimri.xml" maxLength={300} /></label>
        </fieldset>
        <fieldset>
          <legend>Yetkili kişi</legend>
          <label>Ad soyad<input name="yetkili" required maxLength={100} autoComplete="name" /></label>
          <label>E-posta<input name="eposta" type="email" required maxLength={150} autoComplete="email" /></label>
          <label>Telefon<input name="telefon" type="tel" required maxLength={20} autoComplete="tel" /></label>
        </fieldset>
        <input name="web_sitesi" tabIndex={-1} autoComplete="off" aria-hidden="true" className="tuzak" />
        <label className="onay"><input type="checkbox" name="onay" value="evet" required />
          <span>Bilgilerin doğru olduğunu ve şirketi temsil etmeye yetkili olduğumu beyan ederim. <Link href="/kullanim-kosullari" target="_blank">Kullanım koşullarını</Link> ve aşağıdaki aydınlatma metnini okudum.</span></label>
        <button className="dugme">Başvuruyu gönder</button>
      </form>

      <h2>Kişisel verilerin işlenmesi</h2>
      <p className="kucuk soluk">Veri sorumlusu Teknova Elektrik &amp; Otomasyon'dur. Formdaki yetkili adı, e-posta ve telefon bilgileri yalnızca başvurunuzu
        değerlendirmek ve sizinle iletişim kurmak amacıyla, 6698 sayılı KVKK'nın 5/2-c (sözleşmenin kurulması) ve 5/2-f (meşru menfaat)
        hükümlerine dayanarak işlenir, üçüncü kişilerle paylaşılmaz ve başvuru sonuçlandıktan sonra en çok 2 yıl saklanır.
        Bilgilerinize erişme, düzeltilmesini ya da silinmesini isteme haklarınız için <a href="mailto:info@teknovaelektrik.com">info@teknovaelektrik.com</a> adresine yazabilirsiniz.</p>
    </article>
  );
}
