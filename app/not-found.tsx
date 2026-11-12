import Link from "next/link";
import { KATEGORI_AGACI } from "@/lib/katalog/agac.ts";

// 404: kullanıcıyı ve arama motorunu çıkmaz sokakta bırakmaz; aramaya ve kategorilere yönlendirir.
export default function Bulunamadi() {
  return (
    <div className="kutu bos-kategori" style={{ margin: "24px 0" }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Aradığınız sayfa burada değil</h1>
      <p>Ürün kaldırılmış ya da adres değişmiş olabilir. Ürünü aramayı ya da kategorilere göz atmayı deneyin.</p>
      <form className="buyuk-arama" action="/ara" role="search" style={{ border: "1px solid var(--cizgi-koyu)", margin: "18px 0" }}>
        <input name="q" placeholder="Ürün, marka ya da model ara" aria-label="Ürün ara" />
        <button>Ara</button>
      </form>
      <p className="kucuk">{KATEGORI_AGACI.map((k, i) => <span key={k.slug}>{i > 0 && ", "}<Link href={`/kategori/${k.slug}`}>{k.ad}</Link></span>)}</p>
    </div>
  );
}
