import type { Metadata } from "next";
import Link from "next/link";
import { sifreUnuttum } from "@/app/giris/islemler";

export const metadata: Metadata = { title: "Şifremi unuttum", robots: { index: false } };
type P = { searchParams: Promise<{ gonderildi?: string; hata?: string }> };

export default async function SifremiUnuttum({ searchParams }: P) {
  const sp = await searchParams;
  if (sp.gonderildi) return (
    <div className="kutu dar uyelik">
      <h1>E-postanızı kontrol edin</h1>
      <p>Bu bilgilerle bir hesap varsa şifre yenileme bağlantısını kayıtlı e-posta adresine gönderdik. Bağlantı 30 dakika geçerli. Gelmediyse istenmeyen klasörüne bakın.</p>
      <p><Link href="/giris">Giriş sayfasına dön</Link></p>
    </div>
  );
  return (
    <form className="kutu dar uyelik" action={sifreUnuttum}>
      <h1>Şifremi unuttum</h1>
      <p className="soluk">E-posta adresinizi ya da kullanıcı adınızı yazın, şifrenizi yenilemeniz için bağlantı gönderelim.</p>
      {sp.hata === "jeton" && <p className="uyelik-hata" role="alert">Yenileme bağlantısının süresi dolmuş ya da kullanılmış. Yeni bağlantı isteyin.</p>}
      {sp.hata === "gonderilemedi" && <p className="uyelik-hata" role="alert">E-posta şu an gönderilemedi. Birkaç dakika sonra tekrar deneyin.</p>}
      <label>E-posta ya da kullanıcı adı<input name="kimlik" required autoComplete="username" autoFocus /></label>
      <button className="dugme">Yenileme bağlantısı gönder</button>
      <p className="uyelik-alt"><Link href="/giris">Giriş sayfasına dön</Link></p>
    </form>
  );
}
