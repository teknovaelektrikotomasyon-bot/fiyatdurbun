import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { uye } from "@/lib/oturum.ts";

export const metadata: Metadata = {
  title: { default: "Fiyat Dürbün — Fiyat karşılaştırma", template: "%s | Fiyat Dürbün" },
  description: "Ürün fiyatlarını mağaza mağaza karşılaştır, fiyat geçmişini gör, takip ettiğin ürün ucuzlayınca haber al.",
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
};

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
              <button>Ara</button>
            </form>
            <Link className="ust-link gizle" href="/magazalar">Mağazalar</Link>
            <Link className="ust-link" href={u ? "/hesabim" : "/giris"}>{u ? "Takip listem" : "Giriş yap"}</Link>
          </div>
          <nav className="kat-serit" aria-label="Kategoriler">
            <div className="kap">
              <Link href="/kategori/akilli-telefon">Akıllı Telefon</Link>
              <span className="yakinda">Bilgisayar (yakında)</span>
              <span className="yakinda">Televizyon (yakında)</span>
              <span className="yakinda">Beyaz eşya (yakında)</span>
            </div>
          </nav>
        </header>
        <main><div className="kap">{children}</div></main>
        <footer className="alt">
          <div className="kap">
            <span>Fiyat Dürbün fiyatları mağazaların herkese açık sayfalarından okur; satın almadan önce mağazadaki fiyatı kontrol edin.</span>
            <span><Link href="/magazalar">Mağazalar ve güven kontrolü</Link> · <Link href="/bot">Botumuz hakkında</Link></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
