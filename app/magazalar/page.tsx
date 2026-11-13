import Link from "next/link";
import type { Metadata } from "next";
import { magazalar } from "@/lib/sorgular.ts";

export const metadata: Metadata = { title: "Mağazalar ve güven kontrolü", alternates: { canonical: "/magazalar" } };
export const dynamic = "force-dynamic";

const DURUM: Record<string, [string, string]> = {
  onayli: ["yesil", "Kontrol edildi"], inceleniyor: ["", "Kontrol sürüyor"], uyari: ["kirmizi", "Dikkat"], kapali: ["kirmizi", "Listeden çıkarıldı"],
};

export default async function Magazalar() {
  const liste = await magazalar();
  return (
    <>
      <div className="kat-ust"><div>
        <h1>Mağazalar</h1>
        <p><Link className="dugme" href="/magazanizi-ekleyin">Mağazanızı ekleyin</Link></p>
        <p style={{ maxWidth: "70ch" }}>Büyük-küçük her mağazanın fiyatını gösteriyoruz ama önce kontrol ediyoruz: ticari unvan, MERSİS ve vergi numarası, Ticaret Bakanlığı ETBİS kaydı, açık adres ve telefon, iade süresi, yetkili satıcılık ve müşteri şikâyetleri. Kontrolü bitmeyen mağaza “Kontrol sürüyor”, sitesinde firma bilgisi bulamadığımız mağaza “Firma bilgisi bulunamadı” etiketiyle görünür; sorunlu çıkan mağaza listeden çıkarılır. Listede olmak, mağazanın güvenilir olduğuna dair bir güvence değildir (<Link href="/kullanim-kosullari">kullanım koşulları</Link>). Ayrıca her turda fiyatlar karşılaştırılır: aynı ürünü satan diğer mağazaların yarısından ucuz bir teklif “piyasanın çok altında” uyarısı alır ve en ucuz fiyat hesabına girmez; bu tür teklifleri çok olan mağaza otomatik olarak yayından kaldırılır.</p>
      </div></div>
      <div className="kutu">
        <table className="teklif-tablo">
          <thead><tr><th>Mağaza</th><th>Durum</th><th>Kimlik bilgileri</th><th className="sag">Güncel fiyat</th></tr></thead>
          <tbody>
            {liste.map((m) => {
              const [renk, ad] = m.aktif ? DURUM[m.durum] ?? DURUM.inceleniyor : ["", "Henüz okunamıyor"];
              return (
                <tr key={m.slug}>
                  <td><div className="magaza-ad">{m.ad}</div><a className="kucuk soluk" href={m.site} rel="nofollow noopener">{m.site.replace(/^https?:\/\/(www\.)?/, "")}</a></td>
                  <td><span className={`rozet ${renk}`}>{ad}</span>{m.yetkili_satici && <div className="kucuk soluk" style={{ marginTop: 4 }}>{m.yetkili_satici}</div>}</td>
                  <td className="kucuk">
                    {m.unvan ? <div>{m.unvan}</div> : <div className="soluk">Unvan kontrol ediliyor</div>}
                    <div className="soluk">{[m.mersis_no && `MERSİS ${m.mersis_no}`, m.etbis && "ETBİS kayıtlı", m.iade_gun && `${m.iade_gun} gün iade`].filter(Boolean).join(", ")}</div>
                  </td>
                  <td className="sag fiyat">{m.aktif ? m.teklif_sayisi : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
