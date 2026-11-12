import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { KategoriMenusu } from "@/components/KategoriMenusu";
import { KATEGORI_AGACI } from "@/lib/katalog/agac.ts";
import { uye } from "@/lib/oturum.ts";

const site = process.env.SITE_URL ?? "http://localhost:3000";
const dogrulama = {
  google: process.env.GOOGLE_SITE_VERIFICATION,
  yandex: process.env.YANDEX_VERIFICATION,
  other: process.env.BING_VERIFICATION ? { "msvalidate.01": process.env.BING_VERIFICATION } : undefined,
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
            <Link className="ust-link gizle" href="/magazalar">Mağazalar</Link>
            <Link className="ust-link" href={u ? "/hesabim" : "/giris"}>{u ? "Takip listem" : "Giriş yap"}</Link>
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
            <span>Fiyat Dürbün fiyatları mağazaların herkese açık sayfalarından okur; satın almadan önce mağazadaki fiyatı kontrol edin.</span>
            <nav className="alt-linkler" aria-label="Alt bağlantılar"><Link href="/magazalar">Mağazalar ve güven kontrolü</Link><Link href="/bot">Botumuz hakkında</Link></nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
