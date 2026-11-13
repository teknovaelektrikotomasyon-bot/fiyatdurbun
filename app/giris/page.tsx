import type { Metadata } from "next";
import { girisBaglantisiGonder } from "@/app/hesabim/islemler";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };
type P = { searchParams: Promise<{ donus?: string; gonderildi?: string; hata?: string }> };

export default async function Giris({ searchParams }: P) {
  const sp = await searchParams;
  if (sp.gonderildi) return (
    <div className="kutu dar">
      <h1 style={{ fontSize: 26 }}>E-postanızı kontrol edin</h1>
      <p>Giriş bağlantısını gönderdik. Bağlantı 15 dakika geçerli. Gelmediyse istenmeyen klasörüne bakın.</p>
    </div>
  );
  return (
    <form className="kutu dar" action={girisBaglantisiGonder}>
      <h1 style={{ fontSize: 26 }}>Giriş yap ya da üye ol</h1>
      <p className="soluk">Şifre yok. E-posta adresinizi yazın, size giriş bağlantısı gönderelim. Takip ettiğiniz ürünler ucuzlayınca aynı adrese haber veririz.</p>
      <input type="hidden" name="donus" value={sp.donus ?? "/hesabim"} />
      <label className="kucuk" htmlFor="eposta">E-posta</label>
      <input id="eposta" type="email" name="eposta" required autoComplete="email" placeholder="ornek@eposta.com" />
      {sp.hata && <p className="kucuk" style={{ color: "var(--artis)" }}>{sp.hata === "gonderilemedi" ? "Giriş e-postası şu an gönderilemedi. Birkaç dakika sonra tekrar deneyin." : "Geçerli bir e-posta adresi yazın."}</p>}
      <button className="dugme" style={{ width: "100%" }}>Giriş bağlantısı gönder</button>
    </form>
  );
}
