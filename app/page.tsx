import type { Metadata } from "next";
import Link from "next/link";
import { UrunKarti } from "@/components/UrunKarti";
import { Olcek } from "@/components/Olcek";
import { enCokDusenler, fiyatGecmisi, populer } from "@/lib/sorgular.ts";
import { q1 } from "@/lib/db.ts";
import { JsonLd } from "@/components/JsonLd";
import { organizasyonJsonLd, siteJsonLd } from "@/lib/seo.ts";
import { KATEGORI_AGACI } from "@/lib/katalog/agac.ts";

export const dynamic = "force-dynamic";
// Kök düzendeki canonical tüm sayfalara miras kalacağı için yalnızca burada veriliyor.
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export default async function AnaSayfa() {
  const [dusen, pop, say] = await Promise.all([
    enCokDusenler(8), populer(12),
    q1<{ urun: number; magaza: number }>(`select (select count(*)::int from urun u where exists (select 1 from teklif t where t.urun_id=u.id and t.stokta)) as urun, (select count(*)::int from magaza where aktif) as magaza`),
  ]);
  // "Bugün dürbünde": en çok düşen ürün; yoksa en çok mağazada satılan.
  const vitrin = dusen[0] ?? pop[0];
  const gecmis = vitrin ? await fiyatGecmisi(vitrin.id, 30) : [];
  const gunlukMin = Object.values(gecmis.reduce<Record<string, { gun: string; fiyat: number }>>((a, g) => {
    if (!a[g.gun] || g.fiyat < a[g.gun].fiyat) a[g.gun] = { gun: g.gun, fiyat: g.fiyat };
    return a;
  }, {}));

  return (
    <>
      <JsonLd veri={[organizasyonJsonLd(), siteJsonLd()]} />
      <section className="bant">
        <div className="kap bant-ic">
          <div className="bant-metin">
            <h1>Fiyatı yakından görün.</h1>
            <p>Fiyat Dürbün ürün fiyatlarını mağaza mağaza okur ve her gün kaydeder. Bugünkü fiyatın son 30 günün neresinde durduğunu tek bakışta gösterir.</p>
            <form className="buyuk-arama" action="/ara" role="search">
              <input name="q" placeholder="ör. iPhone 17 256 GB" aria-label="Ürün ara" />
              <button>Fiyatları bul</button>
            </form>
            <p className="ornek-aramalar">
              Sık bakılanlar: <Link href="/kategori/akilli-telefon?marka=apple">iPhone</Link>, <Link href="/kategori/akilli-telefon?marka=samsung">Samsung</Link>, <Link href="/kategori/akilli-telefon?marka=xiaomi">Xiaomi</Link>, <Link href="/kategori/akilli-telefon">tüm akıllı telefonlar</Link>
            </p>
          </div>
          {vitrin?.fiyat != null && (
            <Link href={`/urun/${vitrin.slug}`} className="vitrin">
              <div className="vitrin-baslik">
                <span>Bugün dürbünde</span>
                {vitrin.gorsel && <img src={vitrin.gorsel} alt="" />}
              </div>
              <Olcek
                fiyat={vitrin.fiyat}
                gecmis={gunlukMin}
                magazaSayisi={vitrin.magaza_sayisi}
                baslik={<div className="vitrin-ad">{vitrin.marka} {vitrin.model} {vitrin.varyant}</div>}
              />
            </Link>
          )}
        </div>
      </section>

      <p className="kapsam">
        Şu an <b>{say?.magaza ?? 0} mağazada</b> satılan <b>{(say?.urun ?? 0).toLocaleString("tr-TR")} ürünü</b> izliyoruz. Fiyatlar günde dört kez okunuyor. <Link href="/magazalar">Hangi mağazalar, nasıl kontrol ediliyor?</Link>
      </p>

      <section className="serit">
        <div className="serit-baslik"><h2>Kategoriler</h2><Link href="/kategoriler">Tüm kategoriler</Link></div>
        <div className="kok-kartlar">
          {KATEGORI_AGACI.map((k) => (
            <Link key={k.slug} href={`/kategori/${k.slug}`} className="kok-kart">
              <span className="kok-kart-ad">{k.ad}</span>
              <span className="kok-kart-alt">{k.alt?.slice(0, 3).map((a) => a.ad).join(", ")}</span>
            </Link>
          ))}
        </div>
      </section>
      {dusen.length > 0 && (
        <section className="serit">
          <div className="serit-baslik"><h2>Son 30 günde en çok düşenler</h2><Link href="/kategori/akilli-telefon?sirala=dusen">Tümünü gör</Link></div>
          <div className="izgara">{dusen.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        </section>
      )}
      <section className="serit">
        <div className="serit-baslik"><h2>Akıllı telefonlar</h2><Link href="/kategori/akilli-telefon">Tüm telefonlar ve filtreler</Link></div>
        {pop.length ? <div className="izgara">{pop.map((u) => <UrunKarti key={u.id} u={u} />)}</div> : <div className="kutu bos">Henüz fiyat okunmadı. Toplayıcı ilk turunu bitirince burası dolacak.</div>}
      </section>
    </>
  );
}
