import Link from "next/link";
import { tl, type UrunKart } from "@/lib/sorgular.ts";

export function degisim(u: Pick<UrunKart, "fiyat" | "once30">) {
  if (u.fiyat == null || u.once30 == null || u.once30 === u.fiyat) return null;
  return (u.fiyat - u.once30) / u.once30;
}

export function DegisimRozeti({ u }: { u: Pick<UrunKart, "fiyat" | "once30"> }) {
  const d = degisim(u);
  if (d == null || Math.abs(d) < 0.005) return null;
  return <span className={`rozet ${d < 0 ? "yesil" : "kirmizi"}`} title="Son 30 güne göre">{d < 0 ? "▼" : "▲"} %{Math.abs(d * 100).toFixed(0)}</span>;
}

export function kisaOzet(o: UrunKart["ozellikler"]) {
  return [o.ram_gb && `${o.ram_gb} GB RAM`, o.ekran_inc && `${o.ekran_inc}″`, o.batarya_mah && `${o.batarya_mah} mAh`, o["5g"] === true && "5G"].filter(Boolean).join(" · ");
}

export function UrunKarti({ u }: { u: UrunKart }) {
  return (
    <Link href={`/urun/${u.slug}`} className="kutu kart">
      <div className="kart-gorsel">{u.gorsel ? <img src={u.gorsel} alt="" loading="lazy" /> : <span className="soluk">görsel yok</span>}</div>
      <div className="kart-ad">{u.marka} {u.model} <span>{u.varyant}</span></div>
      <div className="kart-ozet">{kisaOzet(u.ozellikler)}</div>
      <div className="kart-alt">
        <span className="kart-fiyat fiyat">{tl(u.fiyat)}</span>
        <DegisimRozeti u={u} />
      </div>
      <div className="kucuk soluk">{u.magaza_sayisi} mağazada</div>
    </Link>
  );
}
