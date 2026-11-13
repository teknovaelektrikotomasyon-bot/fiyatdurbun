import type { Metadata } from "next";
import Link from "next/link";
import { girisYap } from "./islemler";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };
type P = { searchParams: Promise<{ donus?: string; hata?: string; kimlik?: string }> };

const HATA: Record<string, string> = {
  bos: "E-posta ya da kullanıcı adı ile şifrenizi yazın.",
  yanlis: "E-posta/kullanıcı adı ya da şifre hatalı.",
  sinir: "Çok sayıda hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin ya da şifrenizi yenileyin.",
  baglanti: "Bağlantının süresi dolmuş ya da daha önce kullanılmış.",
};

export default async function Giris({ searchParams }: P) {
  const sp = await searchParams;
  const donus = sp.donus ?? "/hesabim";
  return (
    <form className="kutu dar uyelik" action={girisYap}>
      <h1>Giriş yap</h1>
      <input type="hidden" name="donus" value={donus} />
      {sp.hata && HATA[sp.hata] && <p className="uyelik-hata" role="alert">{HATA[sp.hata]}</p>}
      <label>E-posta ya da kullanıcı adı
        <input name="kimlik" required autoComplete="username" defaultValue={sp.kimlik ?? ""} autoFocus />
      </label>
      <label>Şifre
        <input name="sifre" type="password" required autoComplete="current-password" />
      </label>
      <div className="uyelik-satir">
        <label className="uyelik-kutu"><input type="checkbox" name="hatirla" value="evet" defaultChecked /> Beni hatırla</label>
        <Link href="/sifremi-unuttum">Şifremi unuttum</Link>
      </div>
      <button className="dugme">Giriş yap</button>
      <p className="uyelik-alt">Hesabınız yok mu? <Link href={`/kayit?donus=${encodeURIComponent(donus)}`}>Kayıt olun</Link></p>
    </form>
  );
}
