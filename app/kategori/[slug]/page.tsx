import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filtreler } from "@/components/Filtreler";
import { UrunKarti } from "@/components/UrunKarti";
import { KategoriYanMenu } from "@/components/KategoriYanMenu";
import { agacSayilari, altSluglar, kategoriBul, kategoriYolu, ustKategori, type KategoriDugumu } from "@/lib/katalog/agac.ts";
import { filtreSecenekleri, kategori as kategoriSatiri, kategoriIdleri, kategoriMarkalari, kategoriOzet, kategoriUrunSayilari, ozellikler, tl, urunler, type Filtre } from "@/lib/sorgular.ts";
import { JsonLd } from "@/components/JsonLd";
import { ayYil, kirintiJsonLd, kirp, mutlak } from "@/lib/seo.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const SAYFA_BOYU = 48;
const SIRALAR = [["fiyat", "En ucuz"], ["dusen", "En çok düşen"], ["magaza", "En çok mağaza"], ["pahali", "En pahalı"]] as const;

type Durum = { slug: string; marka?: string; sayfa: number; sirali: boolean; digerFiltre: boolean };

// Hangi adres dizine girsin? Temiz kategori, tek marka ve sayfalama girer; sıralama ve diğer filtre birleşimleri
// aynı içeriğin kopyası sayılır: canonical temiz adrese gösterilir, filtreli olanlar noindex olur.
function durumCoz(slug: string, f: Filtre): Durum {
  const marka = f.marka && !f.marka.includes(",") ? f.marka.toLowerCase() : undefined;
  const digerFiltre = Object.keys(f).some((k) => !["sirala", "sayfa", "marka"].includes(k)) || Boolean(f.marka && !marka);
  return { slug, marka, sayfa: Math.max(1, Number(f.sayfa) || 1), sirali: Boolean(f.sirala && f.sirala !== "fiyat"), digerFiltre };
}

function canonicalYol(d: Durum) {
  const p = new URLSearchParams();
  if (d.marka) p.set("marka", d.marka);
  if (d.sayfa > 1 && !d.digerFiltre) p.set("sayfa", String(d.sayfa));
  const q = p.toString();
  return `/kategori/${d.slug}${q ? `?${q}` : ""}`;
}

const filtreCoz = async (sp: P["searchParams"]): Promise<Filtre> =>
  Object.fromEntries(Object.entries(await sp).map(([a, v]) => [a, Array.isArray(v) ? v[0] : v]));

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const slug = (await params).slug;
  const d = kategoriBul(slug);
  if (!d) return {};
  const durum = durumCoz(slug, await filtreCoz(searchParams));
  const idler = (await kategoriIdleri(altSluglar(slug))).map((x) => x.id);
  const [oz, markalar] = await Promise.all([kategoriOzet(idler, durum.marka), durum.marka ? kategoriMarkalari(idler) : Promise.resolve([])]);
  const markaAdi = durum.marka ? markalar.find((m) => m.ad.toLowerCase() === durum.marka)?.ad : undefined;
  const dolu = Boolean(oz?.urun) && (!durum.marka || Boolean(markaAdi));
  const ad = `${markaAdi ? `${markaAdi} ` : ""}${d.ad}`;
  const baslik = dolu ? `${ad} Fiyatları${durum.marka ? "" : " ve Modelleri"} (${ayYil()})${durum.sayfa > 1 ? ` - Sayfa ${durum.sayfa}` : ""}` : `${ad} Fiyatları`;
  const aciklama = dolu && oz
    ? kirp(`${ad} fiyatları: ${oz.urun} modelin ${oz.magaza} mağazadaki fiyatı karşılaştırıldı. En ucuz ${tl(oz.min)}'den başlayan fiyatlar, 30 günlük fiyat geçmişi ve sahte indirim kontrolü.`)
    : `${d.ad} fiyatlarını mağaza mağaza karşılaştırın, fiyat geçmişini görün, ucuzlayınca haber alın.`;
  const yol = canonicalYol(durum);
  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: yol },
    openGraph: { url: yol, title: baslik, description: aciklama },
    robots: !dolu || durum.digerFiltre ? { index: false, follow: true } : undefined,
  };
}

export default async function KategoriSayfasi({ params, searchParams }: P) {
  const slug = (await params).slug;
  const d = kategoriBul(slug);
  if (!d) notFound();
  const f = await filtreCoz(searchParams);
  const durum = durumCoz(slug, f);

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
  const [markalar, oz] = toplam ? await Promise.all([kategoriMarkalari(ids), kategoriOzet(ids, durum.marka)]) : [[], null];
  const markaAdi = durum.marka ? markalar.find((m) => m.ad.toLowerCase() === durum.marka)?.ad : undefined;
  const baslikAdi = `${markaAdi && !durum.digerFiltre ? `${markaAdi} ` : ""}${d.ad}`;

  const yol = kategoriYolu(slug);
  const siralaLink = (s: string) => { const p = new URLSearchParams(f as Record<string, string>); p.set("sirala", s); p.delete("sayfa"); return `?${p}`; };
  const sayfaLink = (n: number) => { const p = new URLSearchParams(f as Record<string, string>); n > 1 ? p.set("sayfa", String(n)) : p.delete("sayfa"); const q = p.toString(); return q ? `?${q}` : "?"; };

  const kirintilar = [{ ad: "Ana sayfa", yol: "/" }, ...yol.map((y) => ({ ad: y.ad, yol: `/kategori/${y.slug}` }))];
  const jsonld: unknown[] = [kirintiJsonLd(kirintilar)];
  if (liste.length) jsonld.push({
    "@context": "https://schema.org", "@type": "ItemList", name: `${baslikAdi} fiyatları`, numberOfItems: liste.length,
    itemListElement: liste.map((u, i) => ({ "@type": "ListItem", position: (sayfa - 1) * SAYFA_BOYU + i + 1, url: mutlak(`/urun/${u.slug}`), name: `${u.marka} ${u.model} ${u.varyant ?? ""}`.trim() })),
  });

  return (
    <>
      <JsonLd veri={jsonld} />
      <nav className="yol" aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        {yol.map((y, i) => <span key={y.slug}> / {i === yol.length - 1 ? <span aria-current="page">{y.ad}</span> : <Link href={`/kategori/${y.slug}`}>{y.ad}</Link>}</span>)}
      </nav>
      <div className="kat-ust">
        <div>
          <h1>{baslikAdi}{toplam ? " fiyatları" : ""}</h1>
          <p>{toplam ? `${filtreli ? "Filtrelere uyan ürünler" : `${toplam} ürün`}${sayfa > 1 ? `, sayfa ${sayfa}` : ""}. Mağaza fiyatları gün içinde güncellenir.` : "Bu kategoride henüz fiyat okumuyoruz."}</p>
        </div>
        {toplam > 0 && (
          <nav className="siralama" aria-label="Sıralama">
            {SIRALAR.map(([s, ad]) => <Link key={s} href={siralaLink(s)} aria-current={(f.sirala ?? "fiyat") === s ? "true" : undefined} scroll={false}>{ad}</Link>)}
          </nav>
        )}
      </div>

      {d.alt && d.alt.length > 0 && <AltKategoriler d={d} sayilar={sayilar} />}
      {markalar.length > 1 && (
        <nav className="marka-serit" aria-label="Markaya göre">
          <span className="soluk kucuk">Markaya göre:</span>
          {markalar.slice(0, 14).map((m) => (
            <Link key={m.ad} href={`/kategori/${slug}?marka=${encodeURIComponent(m.ad.toLowerCase())}`} aria-current={durum.marka === m.ad.toLowerCase() ? "true" : undefined}>{m.ad}</Link>
          ))}
          {durum.marka && <Link href={`/kategori/${slug}`}>Tüm markalar</Link>}
        </nav>
      )}

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
      {oz && oz.urun > 0 && sayfa === 1 && !durum.digerFiltre && <KategoriBilgi ad={baslikAdi} oz={oz} markalar={durum.marka ? [] : markalar} />}
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

// Sayfanın altındaki bilgi metni: tamamen veriden üretilir, her kategori ve marka için kendine özgüdür.
function KategoriBilgi({ ad, oz, markalar }: { ad: string; oz: NonNullable<Awaited<ReturnType<typeof kategoriOzet>>>; markalar: { ad: string; n: number }[] }) {
  const kucuk = ad.toLocaleLowerCase("tr");
  return (
    <section className="kategori-bilgi" aria-labelledby="kategori-bilgi-baslik">
      <h2 id="kategori-bilgi-baslik">{ad} fiyatları hakkında</h2>
      <p>
        Fiyat Dürbün&apos;de şu an {oz.magaza} mağazada satılan {oz.urun} {kucuk} modelinin fiyatını izliyoruz.
        {oz.min != null && oz.max != null && <> Fiyatlar {tl(oz.min)} ile {tl(oz.max)} arasında değişiyor.</>}
        {markalar.length > 1 && <> En çok modeli olan markalar {markalar.slice(0, 3).map((m) => m.ad).join(", ")}.</>}
        {" "}Mağaza fiyatlarını günde birkaç kez okuyup her günü kaydediyoruz; bu sayede bir indirimin gerçekten indirim olup olmadığını fiyat geçmişinden görebilirsiniz.
      </p>
      <div className="sss">
        {oz.en_ucuz && oz.min != null && (
          <div><h3>En ucuz {kucuk} hangisi?</h3><p>Bugün en düşük fiyatlı model {oz.en_ucuz}: {tl(oz.min)}. Kargo ücreti mağazaya göre değişir; ürün sayfasında kargo dahil sıralamayı görebilirsiniz.</p></div>
        )}
        <div><h3>Fiyatlar ne sıklıkla güncelleniyor?</h3><p>Mağaza fiyatlarını günde dört kez okuyoruz. Her ürün sayfasında son 30 günün en düşük ve en yüksek fiyatını ölçek üzerinde gösteriyoruz.</p></div>
        <div><h3>Fiyat Dürbün satış yapıyor mu?</h3><p>Hayır. Fiyatları karşılaştırıp sizi ürünü satan mağazaya yönlendiriyoruz. Satın almadan önce fiyatı mağazanın sayfasında kontrol edin.</p></div>
      </div>
    </section>
  );
}
