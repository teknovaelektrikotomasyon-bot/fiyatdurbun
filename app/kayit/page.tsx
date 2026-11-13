import type { Metadata } from "next";
import Link from "next/link";
import { kayitOl } from "@/app/giris/islemler";

export const metadata: Metadata = { title: "Kayıt ol", robots: { index: false } };
type P = { searchParams: Promise<{ donus?: string; hata?: string; ad?: string; kullanici_adi?: string; eposta?: string }> };

const HATA: Record<string, string> = {
  ad: "Adınızı ve soyadınızı yazın.",
  kullanici: "Kullanıcı adı 3–24 karakter olmalı; yalnız harf, rakam, nokta ve alt çizgi kullanılabilir.",
  kullanici_alinmis: "Bu kullanıcı adı alınmış, başka bir tane deneyin.",
  eposta: "Geçerli bir e-posta adresi yazın.",
  eposta_kayitli: "Bu e-posta ile bir hesap zaten var. Giriş yapın ya da şifrenizi yenileyin.",
  eposta_eski: "Bu e-posta ile daha önce şifresiz giriş yapılmış. “Şifremi unuttum” ile şifre belirleyerek hesabınızı kullanabilirsiniz.",
  sifre: "Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermeli.",
  sifre2: "Şifreler aynı değil.",
  onay: "Devam etmek için kullanım koşullarını ve aydınlatma metnini onaylayın.",
};

export default async function Kayit({ searchParams }: P) {
  const sp = await searchParams;
  const hatalar = (sp.hata ?? "").split(",").filter((h) => HATA[h]);
  return (
    <form className="kutu dar uyelik" action={kayitOl}>
      <h1>Kayıt ol</h1>
      <p className="soluk">Takip ettiğiniz ürünler ucuzlayınca e-posta ile haber verelim.</p>
      <input type="hidden" name="donus" value={sp.donus ?? "/hesabim"} />
      {hatalar.length > 0 && <div className="uyelik-hata" role="alert">{hatalar.map((h) => <p key={h}>{HATA[h]}{h === "eposta_kayitli" || h === "eposta_eski" ? <> <Link href="/sifremi-unuttum">Şifremi unuttum</Link></> : null}</p>)}</div>}
      <label>Ad soyad<input name="ad" required maxLength={80} autoComplete="name" defaultValue={sp.ad ?? ""} /></label>
      <label>Kullanıcı adı<input name="kullanici_adi" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_.]{3,24}" autoComplete="username" defaultValue={sp.kullanici_adi ?? ""} /></label>
      <label>E-posta<input name="eposta" type="email" required maxLength={150} autoComplete="email" defaultValue={sp.eposta ?? ""} /></label>
      <label>Şifre <span className="soluk kucuk">(en az 8 karakter, harf ve rakam)</span><input name="sifre" type="password" required minLength={8} autoComplete="new-password" /></label>
      <label>Şifre (tekrar)<input name="sifre2" type="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="uyelik-kutu"><input type="checkbox" name="onay" value="evet" required />
        <span><Link href="/kullanim-kosullari" target="_blank">Kullanım koşullarını</Link> ve <Link href="/gizlilik" target="_blank">gizlilik politikasını / aydınlatma metnini</Link> okudum.</span></label>
      <label className="uyelik-kutu"><input type="checkbox" name="ileti" value="evet" />
        <span>Fırsat ve kampanya e-postaları almak istiyorum (isteğe bağlı, istediğiniz zaman vazgeçebilirsiniz).</span></label>
      <button className="dugme">Kayıt ol</button>
      <p className="uyelik-alt">Zaten hesabınız var mı? <Link href="/giris">Giriş yapın</Link></p>
      <p className="kucuk soluk">Veri sorumlusu Teknova Elektrik &amp; Otomasyon'dur. Ad, kullanıcı adı ve e-posta bilgileriniz hesabınızı oluşturmak,
        fiyat alarmlarını göndermek ve size hizmet vermek amacıyla KVKK m.5/2-c kapsamında işlenir; kampanya e-postaları yalnız onay verirseniz gönderilir.
        Bilgilerinize erişme, düzeltme ve silinmesini isteme hakkınız için <a href="mailto:info@teknovaelektrik.com">info@teknovaelektrik.com</a>.
        Şifreniz geri döndürülemez biçimde özetlenerek saklanır.</p>
    </form>
  );
}
