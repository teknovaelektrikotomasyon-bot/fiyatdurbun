import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { kirintiJsonLd, mutlak } from "@/lib/seo.ts";
import { gercekIndirimler, sahteIndirimler, tl, type IndirimSatiri } from "@/lib/sorgular.ts";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Gerçek ve sahte indirimler: Efsane Kasım ve Black Friday 2026 fiyat kontrolü",
  description: "Hangi indirim gerçek? Fiyatı son 30 günün en düşüğüne inen ürünler ve önce zamlanıp sonra “indirime” giren ürünler. Mağaza fiyatlarından her saat güncellenir.",
  alternates: { canonical: "/gercek-indirimler" },
  openGraph: { url: "/gercek-indirimler" },
};

const yuzde = (a: number, b: number) => Math.round(Math.abs((a - b) / b) * 100);
const ad = (u: IndirimSatiri) => `${u.marka} ${u.model}${u.varyant ? " " + u.varyant : ""}`;

function Gorsel({ u }: { u: IndirimSatiri }) {
  return <div className="ind-gorsel">{u.gorsel ? <img src={u.gorsel} referrerPolicy="no-referrer" alt="" loading="lazy" /> : null}</div>;
}

function GercekSatir({ u }: { u: IndirimSatiri }) {
  return (
    <li>
      <Link href={`/urun/${u.slug}`} className="ind-satir">
        <Gorsel u={u} />
        <div className="ind-govde">
          <div className="ind-ad">{ad(u)}</div>
          <div className="ind-iz">
            <span>30 günün olağan fiyatı <s>{tl(u.med30)}</s></span>
            <span>30 günün en düşüğü {tl(u.min30)}</span>
          </div>
        </div>
        <div className="ind-fiyat">
          <span className="fiyat">{tl(u.fiyat)}</span>
          <span className="rozet yesil">%{yuzde(u.fiyat, u.med30)} gerçek düşüş</span>
          <span className="kucuk soluk">{u.magaza_sayisi > 1 ? `${u.magaza_sayisi} mağaza` : "1 mağaza"}</span>
        </div>
      </Link>
    </li>
  );
}

function SahteSatir({ u }: { u: IndirimSatiri }) {
  return (
    <li>
      <Link href={`/urun/${u.slug}`} className="ind-satir">
        <Gorsel u={u} />
        <div className="ind-govde">
          <div className="ind-ad">{ad(u)}</div>
          <ol className="ind-zincir" aria-label="Fiyatın seyri">
            <li><span className="soluk kucuk">2–4 hafta önce</span> {tl(u.eski_min)}</li>
            <li className="zam"><span className="soluk kucuk">son 2 haftada zam</span> {tl(u.max14)}</li>
            <li><span className="soluk kucuk">şimdi “indirimde”</span> {tl(u.fiyat)}</li>
          </ol>
        </div>
        <div className="ind-fiyat">
          <span className="fiyat">{tl(u.fiyat)}</span>
          <span className="rozet kirmizi">Zam öncesinden %{yuzde(u.fiyat, u.eski_min!)} pahalı</span>
        </div>
      </Link>
    </li>
  );
}

export default async function GercekIndirimler() {
  const [gercek, sahte] = await Promise.all([gercekIndirimler(48), sahteIndirimler(48)]);
  const saat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date());
  const paylas = encodeURIComponent("Bu indirim gerçek mi? Fiyatı 30 günün en düşüğüne inenler ve önce zamlanıp sonra indirime girenler:");
  const adres = encodeURIComponent(mutlak("/gercek-indirimler"));
  return (
    <>
      <JsonLd veri={[
        kirintiJsonLd([{ ad: "Ana sayfa", yol: "/" }, { ad: "Gerçek ve sahte indirimler", yol: "/gercek-indirimler" }]),
        { "@context": "https://schema.org", "@type": "ItemList", name: "Gerçek indirimler", itemListElement: gercek.slice(0, 20).map((u, i) => ({ "@type": "ListItem", position: i + 1, url: mutlak(`/urun/${u.slug}`), name: ad(u) })) },
      ]} />
      <section className="ind-bas">
        <h1>Bu indirim gerçek mi?</h1>
        <p>Efsane Kasım ve Black Friday'de “indirim” etiketinin bir kısmı, birkaç gün önce yapılan zammın geri alınmasından ibaret.
          Fiyat Dürbün her ürünün fiyatını her gün kaydediyor. Aşağıdaki iki liste bu kayıtlardan otomatik çıkıyor.</p>
        <p className="kucuk">Son güncelleme: {saat}. Liste her saat yenilenir.</p>
        <nav className="ind-sekme" aria-label="Listeler">
          <a href="#gercek">Gerçek indirimler ({gercek.length})</a>
          <a href="#sahte">Zamlanıp indirime girenler ({sahte.length})</a>
        </nav>
      </section>

      <section id="gercek" className="kutu bolum">
        <div className="bolum-baslik"><h2>Gerçek indirimler</h2>
          <span className="kucuk soluk">Bugünkü fiyat son 30 günün en düşüğünde ve olağan fiyatının en az %7 altında.</span></div>
        {gercek.length ? <ul className="ind-liste">{gercek.map((u) => <GercekSatir key={u.id} u={u} />)}</ul>
          : <p className="soluk">Şu an bu ölçüte uyan ürün yok. Fiyatlar her saat yeniden kontrol ediliyor.</p>}
      </section>

      <section id="sahte" className="kutu bolum">
        <div className="bolum-baslik"><h2>Önce zamlanıp sonra “indirime” girenler</h2>
          <span className="kucuk soluk">Son 2 haftada en az %8 zamlanan, şimdi zirveden düşük görünen ama hâlâ zam öncesi fiyatın üstünde olan ürünler.</span></div>
        {sahte.length ? <ul className="ind-liste">{sahte.map((u) => <SahteSatir key={u.id} u={u} />)}</ul>
          : <p className="soluk">Şu an bu ölçüte uyan ürün yok.</p>}
      </section>

      <section className="kutu bolum metin-sayfa">
        <h2>Nasıl hesaplıyoruz?</h2>
        <p>Her ürün için her gün, stokta olan mağazalar arasındaki en düşük fiyatı kaydediyoruz. “Olağan fiyat” son 30 günün ortanca değeridir;
          kısa süreli kampanyalar onu bozmaz. Piyasanın yarısından ucuz görünen şüpheli teklifler hesaba katılmaz.
          Fiyatlar mağazalardan otomatik alınır ve gecikmeli olabilir; satın almadan önce mağazadaki fiyatı kontrol edin
          (<Link href="/kullanim-kosullari">kullanım koşulları</Link>).</p>
        <p className="ind-paylas">Paylaş:{" "}
          <a href={`https://x.com/intent/post?text=${paylas}&url=${adres}`} target="_blank" rel="noopener">X</a>{" · "}
          <a href={`https://wa.me/?text=${paylas}%20${adres}`} target="_blank" rel="noopener">WhatsApp</a>{" · "}
          <a href={`https://t.me/share/url?url=${adres}&text=${paylas}`} target="_blank" rel="noopener">Telegram</a></p>
      </section>
    </>
  );
}
