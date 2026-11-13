import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { q } from "@/lib/db.ts";
import { uye } from "@/lib/oturum.ts";
import { tl } from "@/lib/sorgular.ts";
import { cikisYap, takiptenCik } from "./islemler";
import { dogrulamaTekrar } from "@/app/giris/islemler";
import { uyelikSemasi } from "@/lib/uyelik.ts";
import { q1 } from "@/lib/db.ts";

export const metadata: Metadata = { title: "Takip listem", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Hesabim({ searchParams }: { searchParams: Promise<{ sifre?: string; dogrulama?: string }> }) {
  const sp = await searchParams;
  const ben = await uye();
  if (!ben) redirect("/giris?donus=/hesabim");
  await uyelikSemasi();
  const onay = await q1<{ eposta_onay: string | null }>("select eposta_onay::text from uye where id=$1", [ben.id]);
  const DOGRULAMA: Record<string, [string, string]> = {
    tamam: ["E-posta adresiniz doğrulandı. Fiyat alarmları bu adrese gelecek.", "var(--dusus)"],
    gonderildi: ["Doğrulama e-postasını tekrar gönderdik. Gelen kutunuza (ve istenmeyen klasörüne) bakın.", "var(--dusus)"],
    sinir: ["Kısa sürede çok fazla doğrulama e-postası istendi; biraz sonra tekrar deneyin.", "var(--artis)"],
    hata: ["Doğrulama e-postası şu an gönderilemedi; birkaç dakika sonra tekrar deneyin.", "var(--artis)"],
    gecersiz: ["Doğrulama bağlantısının süresi dolmuş ya da kullanılmış. Yeni bağlantı isteyin.", "var(--artis)"],
  };
  const d = sp.dogrulama ? DOGRULAMA[sp.dogrulama] : undefined;
  const liste = await q<{ id: number; slug: string; ad: string; gorsel: string | null; hedef: number | null; eklenme: number | null; simdi: number | null }>(`
    select u.id, u.slug, mk.ad || ' ' || u.model || ' ' || coalesce(u.varyant,'') as ad, u.gorsel, tk.hedef::float8 as hedef, tk.eklenme_fiyati::float8 as eklenme,
      (select min(fiyat)::float8 from teklif t where t.urun_id=u.id and t.stokta and not t.supheli) as simdi
    from takip tk join urun u on u.id=tk.urun_id join marka mk on mk.id=u.marka_id where tk.uye_id=$1 order by tk.olusturma desc`, [ben.id]);
  return (
    <>
      <div className="kat-ust">
        <div><h1>Takip listem</h1><p>{ben.ad ? `${ben.ad} · ` : ""}{ben.eposta}. Fiyat düşünce ya da hedefinizin altına inince bu adrese yazarız.</p></div>
        <form action={cikisYap}><button className="dugme ikincil">Çıkış yap</button></form>
      </div>
      {d && <p className="kutu" style={{ color: d[1] }}>{d[0]}</p>}
      {!onay?.eposta_onay && (
        <div className="kutu alarm-bant">
          <div><b>E-posta adresinizi doğrulayın</b><span>{ben.eposta} adresine gönderdiğimiz bağlantıya tıklayın. Doğrulanmamış adrese fiyat alarmı gönderilmez.</span></div>
          <form action={dogrulamaTekrar}><button className="dugme">Tekrar gönder</button></form>
        </div>
      )}
      {sp.sifre === "yenilendi" && <p className="kutu" style={{ color: "var(--dusus)" }}>Şifreniz kaydedildi.</p>}
      <div className="kutu">
        {liste.length === 0 && <div className="bos">Henüz takip ettiğiniz ürün yok. Bir ürün sayfasında “Takip et” düğmesine basın.</div>}
        {liste.map((x) => {
          const fark = x.simdi != null && x.eklenme != null ? x.simdi - x.eklenme : null;
          return (
            <div key={x.id} className="liste-satir">
              {x.gorsel ? <img src={x.gorsel} referrerPolicy="no-referrer" alt="" /> : <span />}
              <div>
                <Link href={`/urun/${x.slug}`} style={{ fontWeight: 600 }}>{x.ad}</Link>
                <div className="kucuk soluk">Eklerken {tl(x.eklenme)}{x.hedef ? `. Hedef ${tl(x.hedef)}` : ". Her düşüşte haber"}</div>
              </div>
              <div className="sag">
                <div className="teklif-fiyat fiyat">{tl(x.simdi)}</div>
                {fark != null && fark !== 0 && <span className={`rozet ${fark < 0 ? "yesil" : "kirmizi"}`}>{fark < 0 ? "▼" : "▲"} {tl(Math.abs(fark))}</span>}
                <form action={takiptenCik}><input type="hidden" name="urun" value={x.id} /><button className="temizle" style={{ background: "none", border: 0, cursor: "pointer", padding: "6px 0 0" }}>Takibi bırak</button></form>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
