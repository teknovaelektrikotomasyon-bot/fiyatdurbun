import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiyatGrafigi } from "@/components/FiyatGrafigi";
import { Olcek } from "@/components/Olcek";
import { UrunKarti } from "@/components/UrunKarti";
import { benzerler, fiyatGecmisi, ozellikler, teklifler, tl, urun as urunAl } from "@/lib/sorgular.ts";
import { q1 } from "@/lib/db.ts";
import { uye } from "@/lib/oturum.ts";
import { takipEt, takiptenCik } from "@/app/hesabim/islemler";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ takip?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const u = await urunAl((await params).slug);
  if (!u) return {};
  const ad = `${u.marka} ${u.model} ${u.varyant ?? ""}`.trim();
  return { title: `${ad} fiyatları`, description: `${ad} en ucuz ${tl(u.fiyat)}. ${u.magaza_sayisi} mağazanın fiyatı, fiyat geçmişi ve indirim kontrolü.` };
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
  const [tk, gecmis, ozl, benzer, ben, kat] = await Promise.all([
    teklifler(u.id), fiyatGecmisi(u.id), ozellikler(u.kategori_id), benzerler(u), uye(), q1<{ slug: string; ad: string }>("select slug, ad from kategori where id=$1", [u.kategori_id]),
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
  const stokta = tk.filter((t) => t.stokta);
  const enUcuz = stokta[0];
  const gunlukMin = Object.values(gecmis.reduce<Record<string, { gun: string; fiyat: number }>>((a, g) => {
    if (!a[g.gun] || g.fiyat < a[g.gun].fiyat) a[g.gun] = { gun: g.gun, fiyat: g.fiyat };
    return a;
  }, {}));
  const gruplar = [...new Set(ozl.map((o) => o.grup ?? "Diğer"))];
  const o = u.ozellikler;
  const jsonld = {
    "@context": "https://schema.org", "@type": "Product", name: `${ad} ${u.varyant ?? ""}`.trim(), brand: { "@type": "Brand", name: u.marka }, image: u.gorsel ?? undefined,
    offers: stokta.length ? { "@type": "AggregateOffer", priceCurrency: "TRY", lowPrice: stokta[0].fiyat, highPrice: stokta[stokta.length - 1].fiyat, offerCount: stokta.length } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <div className="yol"><Link href="/">Ana sayfa</Link> / <Link href={`/kategori/${kat?.slug}`}>{kat?.ad}</Link> / <Link href={`/kategori/${kat?.slug}?marka=${u.marka.toLowerCase()}`}>{u.marka}</Link> / {u.model} {u.varyant}</div>
      <section className="kutu urun-ust">
        <div className="urun-gorsel">{u.gorsel ? <img src={u.gorsel} alt={ad} /> : <span className="soluk">görsel yok</span>}</div>
        <div className="urun-bilgi">
          <h1>{ad} {u.varyant}</h1>
          <div className="anahtar-ozellikler">
            {o.ram_gb && <span><b>{String(o.ram_gb)} GB</b> RAM</span>}
            {o.ekran_inc && <span><b>{String(o.ekran_inc)}″</b> {String(o.ekran_tipi ?? "")}</span>}
            {o.arka_kamera_mp && <span><b>{String(o.arka_kamera_mp)} MP</b> kamera</span>}
            {o.batarya_mah && <span><b>{String(o.batarya_mah)} mAh</b></span>}
            {o["5g"] === true && <span><b>5G</b></span>}
          </div>
          {enUcuz ? <Olcek fiyat={u.fiyat ?? enUcuz.fiyat} gecmis={gunlukMin} magazaSayisi={u.magaza_sayisi} /> : <div className="not">Şu an hiçbir mağazada stokta görünmüyor. Takip edin, stoğa girince haber verelim.</div>}
          <div className="takip-form">
            {enUcuz && <a className="dugme mercek" href={`/git/${enUcuz.id}?k=urun-ust`} rel="nofollow sponsored">En ucuzu: {enUcuz.magaza}</a>}
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
                <tr key={t.id} className={i === 0 && t.stokta ? "en-ucuz" : undefined}>
                  <td>
                    <div className="magaza-ad">{t.magaza}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {t.magaza_durum === "onayli" ? <span className="rozet yesil">Kontrol edildi</span> : t.magaza_durum === "uyari" ? <span className="rozet kirmizi">Dikkat</span> : <span className="rozet">Kontrol sürüyor</span>}
                      {t.yetkili_satici && <span className="rozet">{t.yetkili_satici}</span>}
                    </div>
                  </td>
                  <td className="kucuk"><div>{t.secenek > 1 ? `${t.secenek} seçenek` : t.baslik}{t.renkler.length > 1 && <span className="soluk">: {t.renkler.join(", ")}</span>}</div><div className="soluk">{[t.satici && `Satıcı: ${t.satici.replace(/\.$/, "")}`, t.garanti && `Garanti: ${t.garanti.toLowerCase()}`].filter(Boolean).join(". ")}</div></td>
                  <td className="sag">
                    <div className="teklif-fiyat fiyat">{tl(t.fiyat)}</div>
                    {!t.stokta ? <span className="rozet">Stokta yok</span> : sahte ? <span className="rozet sari" title="Son 30 gündeki en düşük fiyatı">30 günde {tl(t.en_dusuk30)} idi</span> : null}
                  </td>
                  <td className="sag kucuk">{t.kargo == null ? <span className="soluk">Sepette görünür</span> : t.kargo === 0 ? "Ücretsiz" : tl(t.kargo)}</td>
                  <td className="sag">{t.stokta && <a className="dugme" href={`/git/${t.id}?k=tablo`} rel="nofollow sponsored">Mağazaya git</a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

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

      {benzer.length > 0 && (
        <section>
          <div className="serit-baslik"><h2>Diğer seçenekler</h2></div>
          <div className="izgara">{benzer.map((b) => <UrunKarti key={b.id} u={b} />)}</div>
        </section>
      )}
    </>
  );
}
