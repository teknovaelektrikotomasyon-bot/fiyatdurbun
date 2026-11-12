import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filtreler } from "@/components/Filtreler";
import { UrunKarti } from "@/components/UrunKarti";
import { KategoriYanMenu } from "@/components/KategoriYanMenu";
import { agacSayilari, altSluglar, kategoriBul, kategoriYolu, ustKategori, type KategoriDugumu } from "@/lib/katalog/agac.ts";
import { filtreSecenekleri, kategori as kategoriSatiri, kategoriIdleri, kategoriUrunSayilari, ozellikler, urunler, type Filtre } from "@/lib/sorgular.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const SAYFA_BOYU = 48;
const SIRALAR = [["fiyat", "En ucuz"], ["dusen", "En çok düşen"], ["magaza", "En çok mağaza"], ["pahali", "En pahalı"]] as const;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = (await params).slug;
  const d = kategoriBul(slug);
  if (!d) return {};
  const sayi = agacSayilari(await kategoriUrunSayilari()).get(slug) ?? 0;
  const satir = await kategoriSatiri(slug);
  return {
    title: `${d.ad} fiyatları`,
    description: satir?.aciklama ?? `${d.ad} fiyatlarını mağaza mağaza karşılaştırın, fiyat geçmişini görün, ucuzlayınca haber alın.`,
    // Henüz ürünü olmayan kategori sayfaları arama motorlarına gösterilmez (boş sayfa izlenimi vermesin).
    robots: sayi ? undefined : { index: false, follow: true },
  };
}

export default async function KategoriSayfasi({ params, searchParams }: P) {
  const slug = (await params).slug;
  const d = kategoriBul(slug);
  if (!d) notFound();
  const ham = await searchParams;
  const f: Filtre = Object.fromEntries(Object.entries(ham).map(([a, v]) => [a, Array.isArray(v) ? v[0] : v]));

  const [idler, satir, yaprakSayilari] = await Promise.all([kategoriIdleri(altSluglar(slug)), kategoriSatiri(slug), kategoriUrunSayilari()]);
  const sayilar = agacSayilari(yaprakSayilari);
  const toplam = sayilar.get(slug) ?? 0;
  const ids = idler.map((x) => x.id);
  const ozl = satir && !d.alt?.length ? await ozellikler(satir.id) : [];
  const sayfa = Math.max(1, Number(f.sayfa) || 1);
  const [ham_liste, sec] = toplam
    ? await Promise.all([urunler(ids, f, ozl, f.sirala ?? "fiyat", SAYFA_BOYU + 1, (sayfa - 1) * SAYFA_BOYU), filtreSecenekleri(ids, ozl)])
    : [[], null];
  const sonrakiVar = ham_liste.length > SAYFA_BOYU;
  const liste = ham_liste.slice(0, SAYFA_BOYU);
  const filtreli = Object.keys(f).some((k) => k !== "sirala" && k !== "sayfa");

  const yol = kategoriYolu(slug);
  const siralaLink = (s: string) => { const p = new URLSearchParams(f as Record<string, string>); p.set("sirala", s); p.delete("sayfa"); return `?${p}`; };
  const sayfaLink = (n: number) => { const p = new URLSearchParams(f as Record<string, string>); n > 1 ? p.set("sayfa", String(n)) : p.delete("sayfa"); const q = p.toString(); return q ? `?${q}` : "?"; };

  return (
    <>
      <nav className="yol" aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        {yol.map((y, i) => <span key={y.slug}> / {i === yol.length - 1 ? <span aria-current="page">{y.ad}</span> : <Link href={`/kategori/${y.slug}`}>{y.ad}</Link>}</span>)}
      </nav>
      <div className="kat-ust">
        <div>
          <h1>{d.ad}{toplam ? " fiyatları" : ""}</h1>
          <p>{toplam ? `${filtreli ? "Filtrelere uyan ürünler" : `${toplam} ürün`}${sayfa > 1 ? `, sayfa ${sayfa}` : ""}. Mağaza fiyatları gün içinde güncellenir.` : "Bu kategoride henüz fiyat okumuyoruz."}</p>
        </div>
        {toplam > 0 && (
          <nav className="siralama" aria-label="Sıralama">
            {SIRALAR.map(([s, ad]) => <Link key={s} href={siralaLink(s)} aria-current={(f.sirala ?? "fiyat") === s ? "true" : undefined} scroll={false}>{ad}</Link>)}
          </nav>
        )}
      </div>

      {d.alt && d.alt.length > 0 && <AltKategoriler d={d} sayilar={sayilar} />}

      {toplam > 0 && sec ? (
        <div className="kat-govde">
          <div className="kat-kenar">
            <KategoriYanMenu slug={slug} sayilar={sayilar} />
            <Filtreler ozellikler={ozl} markalar={sec.markalar} secenek={sec.secenek} aralik={sec.aralik} fiyat={sec.fiyat ?? null} />
          </div>
          <div>
            {liste.length ? <div className="izgara">{liste.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
              : <div className="kutu bos">{sayfa > 1 ? <>Bu sayfada ürün kalmadı. <Link href={sayfaLink(1)}>İlk sayfaya dönün.</Link></> : "Bu filtrelere uyan ürün yok. Bir filtreyi kaldırmayı deneyin."}</div>}
            {(sayfa > 1 || sonrakiVar) && (
              <nav className="sayfalama" aria-label="Sayfalar">
                {sayfa > 1 ? <Link className="dugme ikincil" href={sayfaLink(sayfa - 1)} rel="prev">Önceki sayfa</Link> : <span />}
                <span className="soluk kucuk">Sayfa {sayfa}</span>
                {sonrakiVar ? <Link className="dugme ikincil" href={sayfaLink(sayfa + 1)} rel="next">Sonraki sayfa</Link> : <span />}
              </nav>
            )}
          </div>
        </div>
      ) : (
        <BosKategori d={d} sayilar={sayilar} />
      )}
    </>
  );
}

function AltKategoriler({ d, sayilar }: { d: KategoriDugumu; sayilar: Map<string, number> }) {
  return (
    <section className="alt-kategoriler" aria-label={`${d.ad} alt kategorileri`}>
      {d.alt!.map((a) => {
        const n = sayilar.get(a.slug) ?? 0;
        return (
          <div key={a.slug} className="alt-kat">
            <Link href={`/kategori/${a.slug}`} className="alt-kat-ad">{a.ad}</Link>
            <span className="alt-kat-sayi">{n ? `${n} ürün` : "yakında"}</span>
            {a.alt && <p className="alt-kat-alt">{a.alt.slice(0, 4).map((y, i) => <span key={y.slug}>{i > 0 && ", "}<Link href={`/kategori/${y.slug}`}>{y.ad}</Link></span>)}{a.alt.length > 4 && ` ve ${a.alt.length - 4} kategori daha`}</p>}
          </div>
        );
      })}
    </section>
  );
}

function BosKategori({ d, sayilar }: { d: KategoriDugumu; sayilar: Map<string, number> }) {
  // Kullanıcıyı boş sayfada bırakmamak için: ürünü olan en yakın kategorileri öner.
  const ust = ustKategori(d.slug);
  const kardesler = (ust?.alt ?? []).filter((k) => k.slug !== d.slug && (sayilar.get(k.slug) ?? 0) > 0);
  return (
    <div className="kutu bos-kategori">
      <h2>{d.ad} için mağaza fiyatlarını henüz okumuyoruz</h2>
      <p>Fiyat Dürbün yeni bir site. Mağazaları tek tek, izin ve güven kontrolüyle ekliyoruz. Bu kategori listede; mağazası eklendiğinde fiyatlar burada görünecek.</p>
      <div className="bos-oneriler">
        {kardesler.length > 0 && <p>Bu bölümde fiyatı olanlar: {kardesler.map((k, i) => <span key={k.slug}>{i > 0 && ", "}<Link href={`/kategori/${k.slug}`}>{k.ad}</Link></span>)}</p>}
        <p><Link className="dugme" href="/kategori/akilli-telefon">Akıllı telefon fiyatlarına bak</Link> <Link className="dugme ikincil" href="/kategoriler">Tüm kategoriler</Link></p>
      </div>
    </div>
  );
}
