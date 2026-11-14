import type { Metadata } from "next";
import Link from "next/link";
import { UrunKarti } from "@/components/UrunKarti";
import { Kaydirici } from "@/components/Kaydirici";
import { enCokDusenler, markaListesi, populer, vitrinler } from "@/lib/sorgular.ts";
import { q1 } from "@/lib/db.ts";
import { JsonLd } from "@/components/JsonLd";
import { organizasyonJsonLd, siteJsonLd } from "@/lib/seo.ts";
import { KATEGORI_AGACI, altSluglar } from "@/lib/katalog/agac.ts";
import { uye } from "@/lib/oturum.ts";

export const dynamic = "force-dynamic";
// Kök düzendeki canonical tüm sayfalara miras kalacağı için yalnızca burada veriliyor.
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

// --- Kendi çizdiğimiz basit simgeler (dış görsel kullanılmaz) ---
const S = { width: 30, height: 30, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const Simge = {
  etiket: <svg {...S}><path d="M4 16 16 4h10v10L14 26z" /><circle cx="21" cy="9" r="2" /><path d="M11 17l4 4M13 15l4 4" /></svg>,
  grafik: <svg {...S}><path d="M4 26h24" /><path d="M6 8l7 8 5-4 8 10" /><path d="M22 22h4v-4" /></svg>,
  dukkan: <svg {...S}><path d="M5 12h22l-2-6H7z" /><path d="M7 12v14h18V12" /><path d="M13 26v-7h6v7" /></svg>,
  telefon: <svg {...S}><rect x="9" y="3" width="14" height="26" rx="3" /><path d="M14 25h4" /></svg>,
  devre: <svg {...S}><rect x="9" y="9" width="14" height="14" rx="2" /><path d="M13 9V4M19 9V4M13 28v-5M19 28v-5M9 13H4M9 19H4M28 13h-5M28 19h-5" /></svg>,
  pati: <svg {...S}><circle cx="9" cy="12" r="2.5" /><circle cx="16" cy="8" r="2.5" /><circle cx="23" cy="12" r="2.5" /><path d="M10 23c0-4 3-7 6-7s6 3 6 7c0 3-3 3-6 2-3 1-6 1-6-2z" /></svg>,
  damla: <svg {...S}><path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" /></svg>,
  yuzde: <svg {...S}><path d="M7 25 25 7" /><circle cx="9" cy="9" r="3" /><circle cx="23" cy="23" r="3" /></svg>,
  zil: <svg {...S}><path d="M8 22V14a8 8 0 0 1 16 0v8l2 3H6z" /><path d="M13 28h6" /></svg>,
};

const FIRSATLAR = [
  { ad: "Telefon fırsatları", alt: "Fiyatı düşen modeller", href: "/kategori/akilli-telefon?sirala=dusen", eylem: "Düşenler", simge: Simge.telefon, renk: "f-kirmizi", grup: "telefonKart" },
  { ad: "Robotik ve elektronik", alt: "Arduino, sensör, modül: öğrenciler için", href: "/kategori/elektronik-hobi", eylem: "Karşılaştır", simge: Simge.devre, renk: "f-mavi", grup: "robotik" },
  { ad: "Pet shop", alt: "Mama, kum, ödül", href: "/kategori/pet-shop?sirala=dusen", eylem: "Fiyatı düşenler", simge: Simge.pati, renk: "f-sari", grup: "pet" },
  { ad: "Kozmetik ve bakım", alt: "Dermokozmetik, cilt bakımı", href: "/kategori/kozmetik-kisisel-bakim?sirala=dusen", eylem: "İndirimleri gör", simge: Simge.damla, renk: "f-mor", grup: "kozmetik" },
  { ad: "Bu indirim gerçek mi?", alt: "Zamlanıp indirime girenler", href: "/gercek-indirimler", eylem: "Kontrol et", simge: Simge.yuzde, renk: "f-yesil", grup: "dusen" },
];

export default async function AnaSayfa() {
  const [dusen, pop, say, ben, markalar, vit] = await Promise.all([
    enCokDusenler(10), populer(10),
    q1<{ urun: number; magaza: number }>(`select (select count(*)::int from urun u where exists (select 1 from teklif t where t.urun_id=u.id and t.stokta)) as urun, (select count(*)::int from magaza where aktif) as magaza`),
    uye(),
    markaListesi(5).then((l) => l.sort((a, b) => b.n - a.n).slice(0, 24)).catch(() => []),
    vitrinler({
      telefon: { sluglar: ["akilli-telefon"], adet: 10 },
      bilgisayar: { sluglar: altSluglar("bilgisayar"), adet: 10 },
      telefonKart: { sluglar: ["akilli-telefon"], adet: 3 },
      robotik: { sluglar: altSluglar("elektronik-hobi"), adet: 3 },
      pet: { sluglar: altSluglar("pet-shop"), adet: 3 },
      kozmetik: { sluglar: altSluglar("kozmetik-kisisel-bakim"), adet: 3 },
    }).catch(() => ({} as Record<string, import("@/lib/sorgular.ts").UrunKart[]>)),
  ]);
  // Kart küçük görselleri: telefon kartı vitrindekilerle aynı olmasın diye telefon vitrininin sonundan alınır.
  const kucukler = (g: string) => (g === "dusen" ? dusen.filter((u) => u.gorsel) : g === "telefonKart" ? (vit.telefon ?? []).slice(-3) : vit[g] ?? []).slice(0, 3);
  const alarmAdres = ben ? "/hesabim" : "/giris?donus=/hesabim";

  const slaytlar = [
    { ad: "Bu indirim gerçek mi?", icerik: (
      <Link href="/gercek-indirimler" className="slayt s-gece">
        <div className="slayt-metin"><h2>Bu indirim gerçek mi?</h2><p>Efsane Kasım ve Black Friday'de fiyatı önce artırılıp sonra “indirime” sokulan ürünleri 30 günlük kayıttan ayıklıyoruz.</p><span className="slayt-eylem">Listeye bak</span></div>
        <div className="slayt-cizim" aria-hidden="true"><svg viewBox="0 0 240 160"><path d="M10 120 60 70l40 30 40-60 40 40 50-50" fill="none" stroke="#e8a317" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="140" cy="40" r="12" fill="#fff" /><path d="M10 150h220" stroke="#6f97ad" strokeWidth="4" /></svg></div>
      </Link>) },
    { ad: "Robotik ve elektronik", icerik: (
      <Link href="/kategori/elektronik-hobi" className="slayt s-mavi">
        <div className="slayt-metin"><h2>Proje malzemesini en ucuza topla</h2><p>Geliştirme kartı, sensör, motor sürücü ve komponentlerde robotik mağazalarının fiyatlarını yan yana gör.</p><span className="slayt-eylem">Robotik ve elektronik</span></div>
        <div className="slayt-cizim" aria-hidden="true"><svg viewBox="0 0 240 160"><rect x="70" y="30" width="100" height="100" rx="10" fill="#102a3a" /><rect x="95" y="55" width="50" height="50" rx="4" fill="#e8a317" />{[45, 65, 85, 105].map((y) => <g key={y}><path d={`M70 ${y}H40M170 ${y}h30`} stroke="#102a3a" strokeWidth="6" strokeLinecap="round" /></g>)}</svg></div>
      </Link>) },
    { ad: "Mağazanızı ekleyin", icerik: (
      <Link href="/magazanizi-ekleyin" className="slayt s-sari">
        <div className="slayt-metin"><h2>Mağazanızı ücretsiz ekleyin</h2><p>E-ticaret siteniz varsa şirket bilgilerinizle başvurun; fiyat karşılaştırma siteleri için hazırladığınız XML ürün listesini kullanabilirsiniz.</p><span className="slayt-eylem">Başvur</span></div>
        <div className="slayt-cizim" aria-hidden="true"><svg viewBox="0 0 240 160"><path d="M50 60h140l-12-30H62z" fill="#102a3a" /><path d="M60 60v80h120V60" fill="#fff" stroke="#102a3a" strokeWidth="6" /><path d="M105 140v-40h30v40" fill="#e8a317" /></svg></div>
      </Link>) },
  ];

  return (
    <>
      <JsonLd veri={[organizasyonJsonLd(), siteJsonLd()]} />
      <h1 className="gizli-baslik">Fiyat Dürbün: fiyat karşılaştırma ve fiyat geçmişi</h1>

      <nav className="hizli" aria-label="Kısayollar">
        <Link href="/gercek-indirimler" className="hizli-kart h-yesil">{Simge.etiket}<span>Gerçek indirimler</span></Link>
        <Link href="#dusenler" className="hizli-kart h-mavi">{Simge.grafik}<span>Son 30 günde en çok düşenler</span></Link>
        <Link href="/magazanizi-ekleyin" className="hizli-kart h-sari">{Simge.dukkan}<span>Mağazanızı ekleyin</span></Link>
      </nav>

      <section className="firsat-panel">
        <div className="firsat-bas"><h2>İhtiyacına göre fırsatlar</h2><span className="rozet yesil">Kasım'a özel</span></div>
        <div className="firsat-kartlar">
          {FIRSATLAR.map((f) => (
            <Link key={f.ad} href={f.href} className={`firsat-kart ${f.renk}`}>
              <span className="firsat-ad">{f.ad}</span>
              <span className="firsat-alt">{f.alt}</span>
              <span className="firsat-eylem">{f.eylem}</span>
              {kucukler(f.grup).length ? (
                <span className="firsat-gorseller" aria-hidden="true">
                  {kucukler(f.grup).map((u) => <img key={u.id} src={u.gorsel!} referrerPolicy="no-referrer" alt="" loading="lazy" />)}
                </span>
              ) : <span className="firsat-simge">{f.simge}</span>}
            </Link>
          ))}
        </div>
        <div className="alarm-bant">
          <span className="alarm-simge">{Simge.zil}</span>
          <div><b>İndirimlere hazır mısın?</b><span>Ürünü takibe al, fiyatı düşünce e-posta ile haber verelim.</span></div>
          <Link href={alarmAdres} className="dugme">{ben ? "Takip listemi gör" : "Fiyat alarmı kur"}</Link>
        </div>
      </section>

      <Kaydirici adlar={slaytlar.map((s) => s.ad)}>{slaytlar.map((s) => s.icerik)}</Kaydirici>

      <p className="kapsam">
        Şu an <b>{say?.magaza ?? 0} mağazada</b> satılan <b>{(say?.urun ?? 0).toLocaleString("tr-TR")} ürünü</b> izliyoruz. Fiyatlar günde birkaç kez okunuyor. <Link href="/magazalar">Hangi mağazalar?</Link>
      </p>

      {(vit.telefon?.length ?? 0) > 0 && (
        <section className="serit">
          <div className="serit-baslik"><h2>Cep telefonları</h2><Link href="/kategori/akilli-telefon">Tüm telefonlar</Link></div>
          <div className="izgara">{vit.telefon!.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        </section>
      )}
      {(vit.bilgisayar?.length ?? 0) > 0 && (
        <section className="serit">
          <div className="serit-baslik"><h2>Bilgisayarlar</h2><Link href="/kategori/bilgisayar">Tüm bilgisayarlar</Link></div>
          <div className="izgara">{vit.bilgisayar!.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        </section>
      )}
      {dusen.length > 0 && (
        <section className="serit" id="dusenler">
          <div className="serit-baslik"><h2>Son 30 günde en çok düşenler</h2><Link href="/gercek-indirimler">Gerçek indirimler</Link></div>
          <div className="izgara">{dusen.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        </section>
      )}
      <section className="serit">
        <div className="serit-baslik"><h2>En çok mağazada satılanlar</h2><Link href="/kategoriler">Tüm kategoriler</Link></div>
        {pop.length ? <div className="izgara">{pop.map((u) => <UrunKarti key={u.id} u={u} />)}</div> : <div className="kutu bos">Henüz fiyat okunmadı.</div>}
      </section>
      {markalar.length > 0 && (
        <section className="serit">
          <div className="serit-baslik"><h2>Popüler markalar</h2><Link href="/markalar">Tüm markalar</Link></div>
          <nav className="marka-serit marka-serit-ana" aria-label="Popüler markalar">
            {markalar.map((m) => <Link key={m.slug} href={`/marka/${m.slug}`}>{m.ad}</Link>)}
          </nav>
        </section>
      )}
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
    </>
  );
}
