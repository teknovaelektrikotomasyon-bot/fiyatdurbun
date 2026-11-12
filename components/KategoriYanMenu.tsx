import Link from "next/link";
import { kategoriBul, ustKategori } from "@/lib/katalog/agac.ts";

// Kategori sayfasının sol sütunu: bir üst kategoriye dönüş, bulunulan kategori ve altları (ya da kardeşleri).
// Ürünü olmayan kategoriler soluk gösterilir ama tıklanabilir kalır.
export function KategoriYanMenu({ slug, sayilar }: { slug: string; sayilar: Map<string, number> }) {
  const d = kategoriBul(slug);
  if (!d) return null;
  const ust = ustKategori(slug);
  const liste = d.alt?.length ? d.alt : ust?.alt ?? [];
  const n = (s: string) => sayilar.get(s) ?? 0;
  return (
    <nav className={`kutu yan-menu${d.alt?.length ? " yan-menu-ust" : ""}`} aria-label="Kategori menüsü">
      {ust ? <Link href={`/kategori/${ust.slug}`} className="yan-geri">‹ {ust.ad}</Link> : <Link href="/kategoriler" className="yan-geri">‹ Tüm kategoriler</Link>}
      {d.alt?.length ? <div className="yan-baslik">{d.ad}</div> : null}
      <ul>
        {liste.map((k) => (
          <li key={k.slug}>
            <Link href={`/kategori/${k.slug}`} aria-current={k.slug === slug ? "page" : undefined} className={n(k.slug) ? undefined : "yan-bos"}>
              {k.ad}{n(k.slug) > 0 && <span className="n">{n(k.slug)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
