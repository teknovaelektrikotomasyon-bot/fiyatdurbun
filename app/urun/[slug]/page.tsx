import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiyatGrafigi } from "@/components/FiyatGrafigi";
import { Olcek } from "@/components/Olcek";
import { UrunKarti } from "@/components/UrunKarti";
import { benzerler, disFiyatlar, fiyatGecmisi, ozellikler, teklifler, tl, urun as urunAl } from "@/lib/sorgular.ts";
import { q1 } from "@/lib/db.ts";
import { uye } from "@/lib/oturum.ts";
import { kategoriYolu } from "@/lib/katalog/agac.ts";
import { JsonLd } from "@/components/JsonLd";
import { AvrupaFiyatlari, avrupaOzeti } from "@/components/AvrupaFiyatlari";
import { amazonAramaLinki } from "@/lib/ortaklik";
import { ULKE_ADI } from "@/lib/avrupa/ulkeler.ts";
import { kirintiJsonLd, kirp, mutlak } from "@/lib/seo.ts";
import { takipEt, takiptenCik } from "@/app/hesabim/islemler";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ takip?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const u = await urunAl((await params).slug);
  if (!u) return {};
  const ad = `${u.marka} ${u.model} ${u.varyant ?? ""}`.trim();
  const yol = `/urun/${u.slug}`;
  // Başlıkta fiyat: arama sonucunda kullanıcının aradığı cevabı doğrudan gösterir, tıklanmayı artırır.
  const title = u.fiyat != null ? `${ad} Fiyatları: En Ucuz ${tl(u.fiyat)}` : `${ad} Fiyatları`;
  const ozet = [u.ozellikler.ram_gb && `${u.ozellikler.ram_gb} GB RAM`, u.ozellikler.ekran_inc && `${u.ozellikler.ekran_inc}″ ekran`, u.ozellikler.batarya_mah && `${u.ozellikler.batarya_mah} mAh`].filter(Boolean).join(", ");
  const description = kirp(u.fiyat != null
    ? `${ad} en ucuz ${tl(u.fiyat)}. ${u.magaza_sayisi} mağazanın fiyatı, kargo dahil sıralama, 30 günlük fiyat geçmişi ve sahte indirim kontrolü.${ozet ? ` ${ozet}.` : ""}`
    : `${ad} şu an stokta görünmüyor. Fiyat geçmişini görün, stoğa girince haber alın.${ozet ? ` ${ozet}.` : ""}`);
  return {
    title, description,
    alternates: { canonical: yol },
    openGraph: { type: "website", url: yol, title, description },
  };
}

const deger = (v: unknown, birim: string | null) => {
  if (v === true) return "Var";
  if (v === false) return "Yok";
  if (birim === "GB" && typeof v === "number" && v >= 1024) return `${v / 1024} TB`;
  return birim ? `${v} ${birim}` : String(v);
};

export default async function UrunSayfasi({ params, searchParams }: P) {
  const u = await urunAl((await params).slug);
  if (!u) notFound();
  const sp = await searchParams;
  const [tk, gecmis, ozl, benzer, ben, kat, avrupa] = await Promise.all([
    teklifler(u.id), fiyatGecmisi(u.id), ozellikler(u.kategori_id), benzerler(u), uye(), q1<{ slug: string; ad: string }>("select slug, ad from kategori where id=$1", [u.kategori_id]), disFiyatlar(u.id),
  ]);
  const takip = ben ? await q1<{ hedef: number | null }>("select hedef::float8 as hedef from takip where uye_id=$1 and urun_id=$2", [ben.id, u.id]) : undefined;
  const ad = `${u.marka} ${u.model}`;
  // Aynı mağazanın renk seçenekleri tek satır: en ucuz renk gösterilir, diğer renkler altta listelenir.
  const magazaBasina = new Map<string, (typeof tk)[number] & { renkler: string[]; secenek: number }>();
  for (const t of tk) {
    const v = magazaBasina.get(t.magaza_slug);
    if (!v) magazaBasina.set(t.magaza_slug, { ...t, renkler: t.renk ? [t.renk] : [], secenek: 1 });
    else { v.secenek++; if (t.renk && !v.renkler.includes(t.renk)) v.renkler.push(t.renk); }
  }
  const satirlar = [...magazaBasina.values()];
  const stokta = tk.filter((t) => t.stokta && !t.supheli);
  const enUcuz = stokta[0];
  const gunlukMin = Object.values(gecmis.reduce<Record<string, { gun: string; fiyat: number }>>((a, g) => {
    if (!a[g.gun] || g.fiyat < a[g.gun].fiyat) a[g.gun] = { gun: g.gun, fiyat: g.fiyat };
    return a;
  }, {}));
  const gruplar = [...new Set(ozl.map((o) => o.grup ?? "Diğer"))];
  const o = u.ozellikler;
  // Stok yoksa son görülen fiyat (Google, fiyatsız ürün işaretlemesini geçersiz sayar).
  const sonBilinen = gecmis.length ? gecmis[gecmis.length - 1].fiyat : null;
  const kirintilar = [{ ad: "Ana sayfa", yol: "/" }, ...kategoriYolu(kat?.slug ?? "").map((y) => ({ ad: y.ad, yol: `/kategori/${y.slug}` })), { ad: `${ad} ${u.varyant ?? ""}`.trim(), yol: `/urun/${u.slug}` }];
  const gtin = u.gtin && /^\d{8,14}$/.test(u.gtin) ? u.gtin : undefined;
  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "Product",
      "@id": mutlak(`/urun/${u.slug}#urun`),
      name: `${ad} ${u.varyant ?? ""}`.trim(),
      url: mutlak(`/urun/${u.slug}`),
      sku: u.slug,
      ...(gtin ? { gtin } : {}),
      brand: { "@type": "Brand", name: u.marka },
      image: u.gorsel ? [u.gorsel] : undefined,
      category: kategoriYolu(kat?.slug ?? "").map((y) => y.ad).join(" > "),
      offers: stokta.length
        ? {
            "@type": "AggregateOffer", priceCurrency: "TRY", availability: "https://schema.org/InStock",
            lowPrice: stokta[0].fiyat, highPrice: Math.max(...stokta.map((t) => t.fiyat)), offerCount: stokta.length,
            offers: satirlar.filter((t) => t.stokta && !t.supheli).map((t) => ({
              "@type": "Offer", price: t.fiyat, priceCurrency: "TRY", availability: "https://schema.org/InStock",
              url: mutlak(`/urun/${u.slug}`), seller: { "@type": "Organization", name: t.magaza },
              ...(t.kargo != null ? { shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: t.kargo, currency: "TRY" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" } } } : {}),
            })),
          }
        : sonBilinen != null
          ? { "@type": "Offer", price: sonBilinen, priceCurrency: "TRY", availability: "https://schema.org/OutOfStock", url: mutlak(`/urun/${u.slug}`) }
          : undefined,
    },
    kirintiJsonLd(kirintilar),
  ].filter((x) => (x as Record<string, unknown>)["@type"] !== "Product" || (x as Record<string, unknown>).offers);

  return (
    <>
      <JsonLd veri={jsonld} />
      <nav className="yol" aria-label="Konum"><Link href="/">Ana sayfa</Link>{kategoriYolu(kat?.slug ?? "").map((y) => <span key={y.slug}> / <Link href={`/kategori/${y.slug}`}>{y.ad}</Link></span>)} / <Link href={`/kategori/${kat?.slug}?marka=${u.marka.toLowerCase()}`}>{u.marka}</Link> / <span aria-current="page">{u.model} {u.varyant}</span></nav>
      <section className="kutu urun-ust">
        <div className="urun-gorsel">{u.gorsel ? <img src={u.gorsel} referrerPolicy="no-referrer" alt={`${ad} ${u.varyant ?? ""}`.trim()} fetchPriority="high" decoding="async" /> : <span className="soluk">görsel yok</span>}</div>
        <div className="urun-bilgi">
          <h1>{ad} {u.varyant}</h1>
          <ul className="anahtar-ozellikler">
            {o.ram_gb && <li><b>{String(o.ram_gb)} GB</b> RAM</li>}
            {o.ekran_inc && <li><b>{String(o.ekran_inc)}″</b> {String(o.ekran_tipi ?? "ekran")}</li>}
            {o.arka_kamera_mp && <li><b>{String(o.arka_kamera_mp)} MP</b> kamera</li>}
            {o.batarya_mah && <li><b>{String(o.batarya_mah)}</b> mAh</li>}
            {o["5g"] === true && <li><b>5G</b></li>}
          </ul>
          {enUcuz ? <Olcek fiyat={u.fiyat ?? enUcuz.fiyat} gecmis={gunlukMin} magazaSayisi={u.magaza_sayisi} /> : <div className="not">Şu an hiçbir mağazada stokta görünmüyor. Takip edin, stoğa girince haber verelim.</div>}
          <div className="takip-form" id="alarm">
            {enUcuz && <a className="dugme mercek" href={`/git/${enUcuz.id}?k=urun-ust`} rel="nofollow sponsored">{enUcuz.magaza} sitesine git</a>}
            {ben ? (
              takip ? (
                <form action={takiptenCik}><input type="hidden" name="urun" value={u.id} /><input type="hidden" name="slug" value={u.slug} />
                  <button className="dugme ikincil">Takipte{takip.hedef ? `, hedef ${tl(takip.hedef)}` : ""}. Bırak</button></form>
              ) : (
                <form action={takipEt} className="takip-form" style={{ marginTop: 0 }}>
                  <input type="hidden" name="urun" value={u.id} /><input type="hidden" name="slug" value={u.slug} />
                  <input name="hedef" inputMode="numeric" placeholder="Hedef fiyat (isteğe bağlı)" aria-label="Hedef fiyat" />
                  <button className="dugme ikincil">Takip et, düşünce haber ver</button>
                </form>
              )
            ) : <Link className="dugme ikincil" href={`/giris?donus=/urun/${u.slug}`}>Takip et, düşünce haber ver</Link>}
          </div>
          {(() => {
            const oz = avrupaOzeti(avrupa, enUcuz?.fiyat ?? null);
            if (!oz) return null;
            const ulke = ULKE_ADI[oz.enUcuz.ulke] ?? oz.enUcuz.ulke;
            return <p className="avrupa-ipucu">Avrupa&apos;da en ucuz {ulke}&apos;da: {oz.enUcuz.fiyat.toLocaleString("tr-TR")} € ≈ {tl(Math.round(oz.tlKarsilik))}. <a href="#avrupa">Avrupa fiyatlarını karşılaştır</a></p>;
          })()}
          {sp.takip === "eklendi" && <p className="kucuk" style={{ color: "var(--dusus)" }}>Takibe aldınız. Fiyat düşünce e-posta göndereceğiz.</p>}
        </div>
      </section>

      <section className="kutu bolum">
        <div className="bolum-baslik"><h2>Mağaza fiyatları</h2><span className="kucuk soluk">Kargo dahil sıralı. Satın almadan önce fiyatı mağazada kontrol edin.</span></div>
        <table className="teklif-tablo">
          <thead><tr><th>Mağaza</th><th>Ürün / satıcı</th><th className="sag">Fiyat</th><th className="sag">Kargo</th><th></th></tr></thead>
          <tbody>
            {satirlar.map((t, i) => {
              const sahte = t.en_dusuk30 != null && t.fiyat > t.en_dusuk30 * 1.02;
              return (
                <tr key={t.id} className={i === 0 && t.stokta && !t.supheli ? "en-ucuz" : undefined}>
                  <td>
                    <div className="magaza-ad">{t.magaza}</div>
                    <div className="rozetler">
                      {t.magaza_durum === "onayli" ? <span className="rozet yesil">Kontrol edildi</span> : t.magaza_durum === "uyari" ? <span className="rozet kirmizi">Dikkat</span> : null}
                      {t.yetkili_satici && <span className="rozet">{t.yetkili_satici}</span>}
                    </div>
                  </td>
                  <td className="kucuk"><div>{t.secenek > 1 ? `${t.secenek} seçenek` : t.baslik}{t.renkler.length > 1 && <span className="soluk">: {t.renkler.join(", ")}</span>}</div><div className="soluk">{[t.satici && `Satıcı: ${t.satici.replace(/\.$/, "")}`, t.garanti && `Garanti: ${t.garanti.toLowerCase()}`].filter(Boolean).join(". ")}</div></td>
                  <td className="sag">
                    <div className="teklif-fiyat fiyat">{tl(t.fiyat)}</div>
                    {!t.stokta ? <span className="rozet">Stokta yok</span> : t.supheli ? <span className="rozet kirmizi" title="Bu fiyat, aynı ürünü satan diğer mağazaların yarısından daha düşük. Farklı bir ürün ya da güvenilmez bir teklif olabilir; en ucuz fiyat hesabına katılmadı.">Dikkat: piyasanın çok altında</span> : sahte ? <span className="rozet sari" title="Son 30 gündeki en düşük fiyatı">30 günde {tl(t.en_dusuk30)} idi</span> : null}
                  </td>
                  <td className="sag kucuk">{t.kargo == null ? <span className="soluk">Sepette görünür</span> : t.kargo === 0 ? "Ücretsiz" : tl(t.kargo)}</td>
                  <td className="sag">{t.stokta && <a className="dugme" href={`/git/${t.id}?k=tablo`} rel="nofollow sponsored">Mağazaya git</a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="kucuk soluk teklif-not">Fiyat, stok ve kargo bilgileri mağazaların sayfalarından otomatik alınır ve gecikmeli olabilir; geçerli olan mağaza sayfasındaki bilgidir. Satış mağaza ile sizin aranızda gerçekleşir, Fiyat Dürbün satış yapmaz. <Link href="/kullanim-kosullari">Kullanım koşulları</Link></p>
        <p className="amazon-ara">
          <a href={amazonAramaLinki(`${ad} ${u.varyant ?? ""}`.trim())} target="_blank" rel="nofollow sponsored noopener">Amazon.com.tr'de bu ürünü ara</a>
          <span className="soluk kucuk"> · Amazon fiyatı burada gösterilmez, Amazon'da açılır. Ortaklık bağlantısıdır.</span>
        </p>
      </section>

      <AvrupaFiyatlari satirlar={avrupa} trFiyat={enUcuz?.fiyat ?? null} urunAdi={`${ad} ${u.varyant ?? ""}`.trim()} />

      <section className="kutu bolum">
        <div className="bolum-baslik"><h2>Fiyat geçmişi</h2><span className="kucuk soluk">Mağaza başına günün en düşük fiyatı</span></div>
        <FiyatGrafigi veri={gecmis} />
      </section>

      <section className="kutu bolum">
        <div className="bolum-baslik"><h2>Teknik özellikler</h2></div>
        <div className="ozellik-izgara">
          {gruplar.map((g) => {
            const satirlar = ozl.filter((x) => (x.grup ?? "Diğer") === g && o[x.anahtar] != null);
            if (!satirlar.length) return null;
            return (
              <div key={g} className="ozellik-grup">
                <h3>{g}</h3>
                {satirlar.map((x) => <div key={x.anahtar} className="ozellik-satir"><span>{x.ad}</span><span>{deger(o[x.anahtar], x.birim)}</span></div>)}
              </div>
            );
          })}
        </div>
      </section>

      <UrunBilgi ad={`${ad} ${u.varyant ?? ""}`.trim()} enUcuz={enUcuz ? { magaza: enUcuz.magaza, fiyat: enUcuz.fiyat } : null} magazaSayisi={stokta.length ? new Set(stokta.map((t) => t.magaza)).size : 0} gunluk={gunlukMin} kategori={kat?.ad} />

      {benzer.length > 0 && (
        <section>
          <div className="serit-baslik"><h2>Diğer seçenekler</h2></div>
          <div className="izgara">{benzer.map((b) => <UrunKarti key={b.id} u={b} />)}</div>
        </section>
      )}
    </>
  );
}

// Ürün hakkında kısa, veriden üretilen metin: "X fiyatı ne kadar, en ucuz nerede" aramalarına doğrudan cevap verir.
function UrunBilgi({ ad, enUcuz, magazaSayisi, gunluk, kategori }: { ad: string; enUcuz: { magaza: string; fiyat: number } | null; magazaSayisi: number; gunluk: { gun: string; fiyat: number }[]; kategori?: string }) {
  const sinir = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const son30 = gunluk.filter((g) => g.gun >= sinir).map((g) => g.fiyat);
  const gunSayisi = new Set(gunluk.map((g) => g.gun)).size;
  return (
    <section className="kategori-bilgi" aria-labelledby="urun-bilgi-baslik">
      <h2 id="urun-bilgi-baslik">{ad} fiyatı ne kadar?</h2>
      {enUcuz ? (
        <p>
          {ad} bugün en ucuz {tl(enUcuz.fiyat)} fiyatla {enUcuz.magaza} mağazasında satılıyor. Fiyatını {magazaSayisi} mağazada karşılaştırıyoruz.
          {gunSayisi >= 7 && son30.length > 0 && <> Son 30 günde en düşük {tl(Math.min(...son30))}, en yüksek {tl(Math.max(...son30))} görüldü.</>}
          {" "}Kargo ücretleri mağazaya göre değiştiği için yukarıdaki tabloyu kargo dahil fiyata göre sıraladık.
        </p>
      ) : (
        <p>{ad} şu an izlediğimiz mağazaların hiçbirinde stokta görünmüyor. Takibe alırsanız stoğa girdiğinde ya da fiyatı düştüğünde e-posta ile haber veririz.</p>
      )}
      <div className="sss">
        <div><h3>Bu fiyat iyi mi?</h3><p>Sayfanın başındaki ölçek, bugünkü en ucuz fiyatın son 30 günün en düşüğü ile en yükseği arasında nerede durduğunu gösterir. Ölçeğin sol ucu, son 30 günün en iyi fiyatıdır.</p></div>
        <div><h3>İndirim gerçek mi?</h3><p>Bir mağaza fiyatı son 30 günde daha düşükse tabloda &quot;30 günde … idi&quot; uyarısını görürsünüz. Böylece önce artırılıp sonra indirilmiş fiyatları ayırt edebilirsiniz.</p></div>
        {kategori && <div><h3>Benzer ürünlere nereden bakarım?</h3><p>Aynı modelin diğer seçenekleri aşağıda; tüm modeller için {kategori.toLocaleLowerCase("tr")} kategorisine göz atabilirsiniz.</p></div>}
      </div>
    </section>
  );
}
