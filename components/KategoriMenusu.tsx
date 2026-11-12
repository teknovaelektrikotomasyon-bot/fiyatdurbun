import Link from "next/link";
import { KATEGORI_AGACI, kisaAd, type KategoriDugumu } from "@/lib/katalog/agac.ts";
import { MenuDavranisi } from "./MenuDavranisi";

// Masaüstü: kök kategoriler şeridi; fareyle ya da klavyeyle üzerine gelince o kökün tüm alt kategorileri açılır (mega menü).
// Dokunmatik ve dar ekran: "Kategoriler" düğmesi soldan açılan bir çekmece ve iç içe açılır listeler gösterir.
// İkisi de JavaScript olmadan çalışır; MenuDavranisi yalnızca tıklamadan sonra menüyü kapatır.

const ALT_SINIR = 6;

function Panel({ kok }: { kok: KategoriDugumu }) {
  return (
    <div className="mega-panel">
      <div className="kap mega-ic">
        <div className="mega-ust">
          <Link href={`/kategori/${kok.slug}`} className="mega-baslik">{kok.ad}</Link>
          <Link href={`/kategori/${kok.slug}`} className="mega-tumu">Tüm {kok.ad.toLocaleLowerCase("tr")} ürünleri</Link>
        </div>
        <div className="mega-sutunlar">
          {kok.alt?.map((a) => (
            <section key={a.slug} className="mega-grup">
              <Link href={`/kategori/${a.slug}`} className="mega-grup-baslik">{a.ad}</Link>
              {a.alt && (
                <ul>
                  {a.alt.slice(0, ALT_SINIR).map((y) => <li key={y.slug}><Link href={`/kategori/${y.slug}`}>{y.ad}</Link></li>)}
                  {a.alt.length > ALT_SINIR && <li><Link href={`/kategori/${a.slug}`} className="mega-daha">{a.alt.length - ALT_SINIR} kategori daha</Link></li>}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KategoriMenusu() {
  return (
    <MenuDavranisi>
      <nav className="kat-serit" aria-label="Kategoriler">
        <div className="kap kat-serit-ic">
          <details className="cekmece">
            <summary className="cekmece-dugme">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
              Kategoriler
            </summary>
            <div className="cekmece-govde">
              <div className="cekmece-ust">
                <span>Kategoriler</span>
                <button type="button" className="cekmece-kapat" data-kapat aria-label="Menüyü kapat">×</button>
                <Link href="/kategoriler" className="cekmece-tumu">Tümünü bir sayfada gör</Link>
              </div>
              <ul className="cekmece-liste">
                {KATEGORI_AGACI.map((k) => (
                  <li key={k.slug}>
                    <details>
                      <summary>{k.ad}</summary>
                      <ul>
                        <li><Link href={`/kategori/${k.slug}`} className="cekmece-hepsi">Tüm {k.ad}</Link></li>
                        {k.alt?.map((a) => (
                          <li key={a.slug}>
                            <details>
                              <summary>{a.ad}</summary>
                              <ul>
                                <li><Link href={`/kategori/${a.slug}`} className="cekmece-hepsi">Tüm {a.ad}</Link></li>
                                {a.alt?.map((y) => <li key={y.slug}><Link href={`/kategori/${y.slug}`}>{y.ad}</Link></li>)}
                              </ul>
                            </details>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </details>
          <ul className="kok-liste">
            {KATEGORI_AGACI.map((k) => (
              <li key={k.slug} className="kok">
                <Link href={`/kategori/${k.slug}`} className="kok-link" data-kok={k.slug}>{kisaAd(k)}</Link>
                <Panel kok={k} />
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </MenuDavranisi>
  );
}
