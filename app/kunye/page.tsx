import type { Metadata } from "next";
import Link from "next/link";
import { FIRMA } from "@/lib/firma.ts";

export const metadata: Metadata = { title: "Künye", description: "Fiyat Dürbün'ü işleten firmanın iletişim ve kimlik bilgileri.", alternates: { canonical: "/kunye" } };

export default function Kunye() {
  const satirlar: [string, string][] = ([
    ["İşletmeci", FIRMA.unvan || FIRMA.ad], ["Adres", FIRMA.adres || FIRMA.il], ["Vergi dairesi", FIRMA.vergiDairesi],
    ["Vergi no", FIRMA.vergiNo], ["MERSİS no", FIRMA.mersisNo], ["E-posta", FIRMA.eposta], ["Telefon", FIRMA.telefon], ["Web", FIRMA.web],
  ] as [string, string][]).filter(([, d]) => d);
  return (
    <article className="kutu metin-sayfa" style={{ maxWidth: "72ch" }}>
      <h1>Künye</h1>
      <p>Fiyat Dürbün (fiyatdurbun.com), aşağıdaki işletme tarafından işletilen bağımsız bir fiyat karşılaştırma sitesidir. Sitede satış yapılmaz.</p>
      <table className="kunye-tablo"><tbody>{satirlar.map(([a, d]) => <tr key={a}><th scope="row">{a}</th><td>{a === "E-posta" ? <a href={`mailto:${d}`}>{d}</a> : a === "Web" ? <a href={d}>{d.replace(/^https?:\/\//, "")}</a> : d}</td></tr>)}</tbody></table>
      <p>Ayrıca bakınız: <Link href="/kullanim-kosullari">Kullanım koşulları</Link>, <Link href="/gizlilik">Gizlilik politikası ve KVKK aydınlatma metni</Link>.</p>
    </article>
  );
}
