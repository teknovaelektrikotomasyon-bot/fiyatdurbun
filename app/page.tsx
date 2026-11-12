import Link from "next/link";
import { UrunKarti } from "@/components/UrunKarti";
import { enCokDusenler, populer } from "@/lib/sorgular.ts";
import { q1 } from "@/lib/db.ts";

export const dynamic = "force-dynamic";

export default async function AnaSayfa() {
  const [dusen, pop, say] = await Promise.all([
    enCokDusenler(8), populer(8),
    q1<{ urun: number; teklif: number; magaza: number }>(`select (select count(*)::int from urun) as urun, (select count(*)::int from teklif where stokta) as teklif, (select count(*)::int from magaza where aktif) as magaza`),
  ]);
  return (
    <>
      <section className="giris">
        <div>
          <h1>Aynı telefon, farklı fiyat. Hangisi gerçekten ucuz, bakın.</h1>
          <p>Fiyat Dürbün mağazaların fiyatlarını gün içinde birkaç kez okur, geçmişini saklar. İndirim gerçek mi, bugün almak mantıklı mı, tek sayfada görürsünüz.</p>
          <form className="buyuk-arama" action="/ara" role="search">
            <input name="q" placeholder="ör. iPhone 17 256 GB" aria-label="Ürün ara" />
            <button>Fiyatları bul</button>
          </form>
          <div className="ornek-aramalar">
            <span>Sık arananlar:</span>
            <Link href="/ara?q=iphone 17">iPhone 17</Link>
            <Link href="/ara?q=galaxy s">Galaxy S serisi</Link>
            <Link href="/kategori/akilli-telefon?5g=1&fiyat=-20000">20.000 TL altı 5G</Link>
          </div>
        </div>
        <div className="sayac">
          <div><b className="sayi">{say?.urun ?? 0}</b><span>ürün</span></div>
          <div><b className="sayi">{say?.teklif ?? 0}</b><span>güncel fiyat</span></div>
          <div><b className="sayi">{say?.magaza ?? 0}</b><span>mağaza</span></div>
        </div>
      </section>

      {dusen.length > 0 && (
        <section>
          <div className="serit-baslik"><h2>Son 30 günde en çok düşenler</h2><Link href="/kategori/akilli-telefon?sirala=dusen" className="kucuk">Tümü</Link></div>
          <div className="izgara">{dusen.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        </section>
      )}
      <section>
        <div className="serit-baslik"><h2>Akıllı telefonlar</h2><Link href="/kategori/akilli-telefon" className="kucuk">Tüm telefonlar ve filtreler</Link></div>
        {pop.length ? <div className="izgara">{pop.map((u) => <UrunKarti key={u.id} u={u} />)}</div> : <div className="kutu bos">Henüz fiyat okunmadı. Toplayıcı ilk turunu bitirince burası dolacak.</div>}
      </section>
    </>
  );
}
