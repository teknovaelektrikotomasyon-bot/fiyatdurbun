import type { Metadata } from "next";
import Link from "next/link";
import { markaListesi } from "@/lib/sorgular.ts";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Markalar",
  description: "Fiyatını karşılaştırdığımız tüm markalar. Markaya tıklayın, o markanın ürünlerini ve mağaza fiyatlarını görün.",
  alternates: { canonical: "/markalar" },
};

const harfi = (ad: string) => {
  const h = ad.trim().charAt(0).toLocaleUpperCase("tr-TR");
  return /[A-ZÇĞİÖŞÜ]/.test(h) ? h : "#";
};

export default async function Markalar() {
  const liste = (await markaListesi(3)).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  const gruplar = new Map<string, typeof liste>();
  for (const m of liste) { const h = harfi(m.ad); gruplar.set(h, [...(gruplar.get(h) ?? []), m]); }
  const harfler = [...gruplar.keys()];
  return (
    <>
      <nav className="yol" aria-label="Konum"><Link href="/">Ana sayfa</Link> / <span aria-current="page">Markalar</span></nav>
      <div className="kat-ust"><div><h1>Markalar</h1><p>{liste.length} marka. Bir markaya tıklayın, ürünlerini ve mağaza fiyatlarını görün.</p></div></div>
      <nav className="harf-serit" aria-label="Harfe atla">{harfler.map((h) => <a key={h} href={`#harf-${h}`}>{h}</a>)}</nav>
      <div className="marka-dizin">
        {harfler.map((h) => (
          <section key={h} id={`harf-${h}`}>
            <h2>{h}</h2>
            <ul>{gruplar.get(h)!.map((m) => <li key={m.slug}><Link href={`/marka/${m.slug}`}>{m.ad}</Link> <span className="soluk kucuk">{m.n}</span></li>)}</ul>
          </section>
        ))}
      </div>
    </>
  );
}
