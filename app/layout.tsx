import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { KategoriMenusu } from "@/components/KategoriMenusu";
import { KATEGORI_AGACI } from "@/lib/katalog/agac.ts";
import { uye } from "@/lib/oturum.ts";
import { cikisYap } from "@/app/hesabim/islemler";

const site = process.env.SITE_URL ?? "http://localhost:3000";
const dogrulama = {
  google: process.env.GOOGLE_SITE_VERIFICATION,
  yandex: process.env.YANDEX_VERIFICATION,
  other: {
    // Admitad (Mitgo) reklam alanı doğrulaması
    "mitgo-verification": ["3ec4f0bf-a1b8-43d7-9a45-f7bbdaf82e93", "8a9796cf-11d2-4b1e-ad92-1da03e009bd1"],
    ...(process.env.BING_VERIFICATION ? { "msvalidate.01": process.env.BING_VERIFICATION } : {}),
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Fiyat Karşılaştırma: En Ucuz Fiyatlar ve Fiyat Geçmişi | Fiyat Dürbün", template: "%s | Fiyat Dürbün" },
  description: "Ürün fiyatlarını mağaza mağaza karşılaştırın, fiyat geçmişini görün, indirimin gerçek olup olmadığını öğrenin. Takip ettiğiniz ürün ucuzlayınca e-posta ile haber alın.",
  applicationName: "Fiyat Dürbün",
  openGraph: { type: "website", siteName: "Fiyat Dürbün", locale: "tr_TR" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { telephone: false },
  verification: dogrulama,
  category: "shopping",
};

export const viewport: Viewport = { themeColor: "#102a3a", width: "device-width", initialScale: 1 };

export default async function Kok({ children }: { children: React.ReactNode }) {
  const u = await uye();
  return (
    <html lang="tr">
      <body>
        <header className="ust">
          <div className="kap">
            <Link href="/" aria-label="Fiyat Dürbün ana sayfa"><Logo /></Link>
            <form className="arama" action="/ara" role="search">
              <input name="q" placeholder="Ürün, marka ya da model ara" aria-label="Ara" />
              <button aria-label="Ara"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg></button>
            </form>
            <Link className="ust-ikon" href={u ? "/hesabim" : "/giris?donus=/hesabim"}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 22V14a8 8 0 0 1 16 0v8l2 3H6z" /><path d="M13 28h6" /></svg>
              <span>Fiyat alarmı</span>
            </Link>
            <details className="hesap-menu">
              <summary className="ust-ikon">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="16" cy="12" r="5" /><path d="M6 28c1-6 5-9 10-9s9 3 10 9" /></svg>
                <span>{u ? "Hesabım" : "Giriş yap"}</span>
              </summary>
              <div className="hesap-liste">
                {u ? (<>
                  <span className="hesap-eposta">{u.eposta}</span>
                  <Link href="/hesabim">Takip listem ve fiyat alarmları</Link>
                  <form action={cikisYap}><button type="submit">Çıkış yap</button></form>
                </>) : (<>
                  <Link href="/giris">Giriş yap</Link>
                  <Link href="/kayit">Kayıt ol</Link>
                  <Link href="/giris?donus=/hesabim">Fiyat alarmlarım</Link>
                  <Link href="/magazanizi-ekleyin">Mağazanızı ekleyin</Link>
                </>)}
              </div>
            </details>
          </div>
          <KategoriMenusu />
        </header>
        <main><div className="kap">{children}</div></main>
        <footer className="alt">
          <nav className="kap alt-kategoriler-serit" aria-label="Kategoriler">
            {KATEGORI_AGACI.map((k) => <Link key={k.slug} href={`/kategori/${k.slug}`}>{k.ad}</Link>)}
            <Link href="/kategoriler">Tüm kategoriler</Link>
          </nav>
          <div className="kap">
            <span>Fiyat Dürbün satış yapmaz; fiyatları mağazaların herkese açık sayfalarından okur ve mağazaların güvenilirliği için güvence vermez. Satın almadan önce mağazadaki fiyatı kontrol edin. Amazon Ortağı olarak, uygun alışverişlerden gelir elde ediyoruz; bazı mağaza bağlantıları ortaklık bağlantısıdır ve size ek maliyet getirmez.</span>
            <nav className="alt-linkler" aria-label="Alt bağlantılar"><Link href="/gercek-indirimler">Gerçek ve sahte indirimler</Link><Link href="/hakkimizda">Hakkımızda</Link><Link href="/magazalar">Mağazalar ve güven kontrolü</Link><Link href="/bot">Botumuz hakkında</Link><Link href="/kullanim-kosullari">Kullanım koşulları</Link><Link href="/magazanizi-ekleyin">Mağazanızı ekleyin</Link></nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
