import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Filtreler } from "@/components/Filtreler";
import { UrunKarti } from "@/components/UrunKarti";
import { filtreSecenekleri, kategori, ozellikler, urunler, type Filtre } from "@/lib/sorgular.ts";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const k = await kategori((await params).slug);
  return k ? { title: `${k.ad} fiyatları`, description: k.aciklama ?? undefined } : {};
}

const SIRALAR = [["fiyat", "En ucuz"], ["dusen", "En çok düşen"], ["magaza", "En çok mağaza"], ["pahali", "En pahalı"]] as const;

export default async function KategoriSayfasi({ params, searchParams }: P) {
  const k = await kategori((await params).slug);
  if (!k) notFound();
  const ham = await searchParams;
  const f: Filtre = Object.fromEntries(Object.entries(ham).map(([a, v]) => [a, Array.isArray(v) ? v[0] : v]));
  const ozl = await ozellikler(k.id);
  const [liste, sec] = await Promise.all([urunler(k.id, f, ozl, f.sirala ?? "fiyat", 120), filtreSecenekleri(k.id, ozl)]);
  const siralaLink = (s: string) => { const p = new URLSearchParams(f as Record<string, string>); p.set("sirala", s); return `?${p}`; };
  return (
    <>
      <div className="yol"><Link href="/">Ana sayfa</Link> / {k.ad}</div>
      <div className="kat-ust">
        <div><h1>{k.ad} fiyatları</h1><p>{liste.length} model, mağaza fiyatları gün içinde güncellenir.</p></div>
        <nav className="siralama" aria-label="Sıralama">
          {SIRALAR.map(([s, ad]) => <Link key={s} href={siralaLink(s)} aria-current={(f.sirala ?? "fiyat") === s ? "true" : undefined} scroll={false}>{ad}</Link>)}
        </nav>
      </div>
      <div className="kat-govde">
        <Filtreler ozellikler={ozl} markalar={sec.markalar} secenek={sec.secenek} aralik={sec.aralik} fiyat={sec.fiyat ?? null} />
        {liste.length ? <div className="izgara">{liste.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
          : <div className="kutu bos">Bu filtrelere uyan ürün yok. Bir filtreyi kaldırmayı deneyin.</div>}
      </div>
    </>
  );
}
