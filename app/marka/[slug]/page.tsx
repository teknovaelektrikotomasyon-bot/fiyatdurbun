import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UrunKarti } from "@/components/UrunKarti";
import { JsonLd } from "@/components/JsonLd";
import { markaBul, markaKategorileri, markaUrunleri } from "@/lib/sorgular.ts";
import { ayYil, kirintiJsonLd, mutlak } from "@/lib/seo.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ kategori?: string; sirala?: string; sayfa?: string }> };

const SAYFA_BOYU = 48;
const SIRALAR = [["fiyat", "En ucuz"], ["dusen", "En çok düşen"], ["magaza", "En çok mağaza"], ["pahali", "En pahalı"]] as const;

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const m = await markaBul((await params).slug);
  if (!m) return {};
  const sp = await searchParams;
  const kats = await markaKategorileri(m.id);
  const toplam = kats.reduce((a, k) => a + k.n, 0);
  const kat = sp.kategori ? kats.find((k) => k.slug === sp.kategori) : undefined;
  const ad = `${m.ad}${kat ? ` ${kat.ad}` : ""}`;
  const baslik = `${ad} Fiyatları (${ayYil()})`;
  const aciklama = `${ad}: ${kat?.n ?? toplam} ürünün mağaza fiyatlarını karşılaştırın, fiyat geçmişini görün, fiyatı düşünce haber alın.`;
  const yol = `/marka/${m.slug}${kat ? `?kategori=${kat.slug}` : ""}`;
  return {
    title: baslik, description: aciklama,
    alternates: { canonical: yol }, openGraph: { url: yol, title: baslik, description: aciklama },
    robots: toplam < 3 || sp.sirala || sp.sayfa || (sp.kategori && !kat) ? { index: false, follow: true } : undefined,
  };
}

export default async function MarkaSayfasi({ params, searchParams }: P) {
  const m = await markaBul((await params).slug);
  if (!m) notFound();
  const sp = await searchParams;
  const kats = await markaKategorileri(m.id);
  const kat = sp.kategori ? kats.find((k) => k.slug === sp.kategori) : undefined;
  const sayfa = Math.max(1, Number(sp.sayfa) || 1);
  const ham = await markaUrunleri(m.id, kat?.slug, sp.sirala ?? "fiyat", SAYFA_BOYU + 1, (sayfa - 1) * SAYFA_BOYU);
  const liste = ham.slice(0, SAYFA_BOYU);
  const sonrakiVar = ham.length > SAYFA_BOYU;
  const toplam = kats.reduce((a, k) => a + k.n, 0);

  const link = (d: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const birlesik = { kategori: kat?.slug, sirala: sp.sirala, ...d };
    for (const [a, v] of Object.entries(birlesik)) if (v && !(a === "sirala" && v === "fiyat") && !(a === "sayfa" && v === "1")) p.set(a, v);
    const s = p.toString();
    return s ? `?${s}` : `/marka/${m.slug}`;
  };

  const jsonld: unknown[] = [kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Markalar", yol: "/markalar" }, { ad: m.ad, yol: `/marka/${m.slug}` }])];
  if (liste.length) jsonld.push({
    "@context": "https://schema.org", "@type": "ItemList", name: `${m.ad} fiyatları`, numberOfItems: liste.length,
    itemListElement: liste.map((u, i) => ({ "@type": "ListItem", position: (sayfa - 1) * SAYFA_BOYU + i + 1, url: mutlak(`/urun/${u.slug}`), name: `${u.marka} ${u.model} ${u.varyant ?? ""}`.trim() })),
  });

  return (
    <>
      <JsonLd veri={jsonld} />
      <nav className="yol" aria-label="Konum"><Link href="/">Ana sayfa</Link> / <Link href="/markalar">Markalar</Link> / <span aria-current="page">{m.ad}</span></nav>
      <div className="kat-ust">
        <div>
          <h1>{m.ad}{kat ? ` ${kat.ad}` : ""} fiyatları</h1>
          <p>{toplam ? `${kat?.n ?? toplam} ürün${kats.length > 1 && !kat ? `, ${kats.length} kategoride` : ""}${sayfa > 1 ? `, sayfa ${sayfa}` : ""}. Mağaza fiyatları gün içinde güncellenir.` : "Bu markanın şu an stokta ürünü yok."}</p>
        </div>
        {liste.length > 0 && (
          <nav className="siralama" aria-label="Sıralama">
            {SIRALAR.map(([s, ad]) => <Link key={s} href={link({ sirala: s, sayfa: undefined })} aria-current={(sp.sirala ?? "fiyat") === s ? "true" : undefined} scroll={false}>{ad}</Link>)}
          </nav>
        )}
      </div>
      {kats.length > 1 && (
        <nav className="marka-serit" aria-label="Kategoriye göre">
          <Link href={link({ kategori: undefined, sayfa: undefined })} aria-current={!kat ? "true" : undefined}>Tümü ({toplam})</Link>
          {kats.slice(0, 20).map((k) => <Link key={k.slug} href={link({ kategori: k.slug, sayfa: undefined })} aria-current={kat?.slug === k.slug ? "true" : undefined}>{k.ad} ({k.n})</Link>)}
        </nav>
      )}
      {liste.length ? <div className="izgara">{liste.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        : <div className="kutu bos">{sayfa > 1 ? <>Bu sayfada ürün kalmadı. <Link href={link({ sayfa: undefined })}>İlk sayfaya dönün.</Link></> : <>Bu markanın şu an fiyatı olan ürünü yok. <Link href="/markalar">Diğer markalara göz atın.</Link></>}</div>}
      {(sayfa > 1 || sonrakiVar) && (
        <nav className="sayfalama" aria-label="Sayfalar">
          {sayfa > 1 ? <Link className="dugme ikincil" href={link({ sayfa: String(sayfa - 1) })} rel="prev">Önceki sayfa</Link> : <span />}
          <span className="soluk kucuk">Sayfa {sayfa}</span>
          {sonrakiVar ? <Link className="dugme ikincil" href={link({ sayfa: String(sayfa + 1) })} rel="next">Sonraki sayfa</Link> : <span />}
        </nav>
      )}
    </>
  );
}
