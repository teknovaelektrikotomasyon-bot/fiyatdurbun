import Link from "next/link";
import type { Metadata } from "next";
import { magazalar } from "@/lib/sorgular.ts";

export const metadata: Metadata = { title: "Mağazalar ve güven kontrolü", alternates: { canonical: "/magazalar" } };
export const dynamic = "force-dynamic";

const DURUM: Record<string, [string, string]> = {
  onayli: ["yesil", "Kontrol edildi"], inceleniyor: ["", ""], uyari: ["kirmizi", "Dikkat"], kapali: ["kirmizi", "Listeden çıkarıldı"],
};

export default async function Magazalar() {
  const liste = await magazalar();
  return (
    <>
      <div className="kat-ust"><div>
        <h1>Mağazalar</h1>
        <p><Link className="dugme" href="/magazanizi-ekleyin">Mağazanızı ekleyin</Link></p>
        <p style={{ maxWidth: "70ch" }}>Fiyatlarını karşılaştırdığımız mağazalar. Her turda teklifler birbiriyle karşılaştırılır: aynı ürünü satan diğer mağazaların yarısından ucuz bir teklif “piyasanın çok altında” uyarısı alır ve en ucuz fiyat hesabına girmez; bu tür teklifleri çok olan mağaza otomatik olarak yayından kaldırılır. Listede olmak, mağazanın güvenilir olduğuna dair bir güvence değildir (<Link href="/kullanim-kosullari">kullanım koşulları</Link>).</p>
      </div></div>
      <div className="kutu">
        <table className="teklif-tablo">
          <thead><tr><th>Mağaza</th><th>Durum</th><th className="sag">Güncel fiyat</th></tr></thead>
          <tbody>
            {liste.map((m) => {
              const [renk, ad] = m.aktif ? DURUM[m.durum] ?? DURUM.inceleniyor : ["", "Henüz okunamıyor"];
              return (
                <tr key={m.slug}>
                  <td><div className="magaza-ad">{m.ad}</div><a className="kucuk soluk" href={m.site} rel="nofollow noopener">{m.site.replace(/^https?:\/\/(www\.)?/, "")}</a></td>
                  <td>{ad && <span className={`rozet ${renk}`}>{ad}</span>}{m.yetkili_satici && <div className="kucuk soluk" style={{ marginTop: ad ? 4 : 0 }}>{m.yetkili_satici}</div>}</td>
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
