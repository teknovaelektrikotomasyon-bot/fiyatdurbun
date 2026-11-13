import Link from "next/link";
import { tl, type UrunKart } from "@/lib/sorgular.ts";
import { MiniOlcek } from "@/components/Olcek";

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
  return [o.ram_gb && `${o.ram_gb} GB RAM`, o.ekran_inc && `${o.ekran_inc}″ ekran`, o.batarya_mah && `${o.batarya_mah} mAh`, o["5g"] === true && "5G"].filter(Boolean).join(", ");
}

export function UrunKarti({ u }: { u: UrunKart }) {
  return (
    <Link href={`/urun/${u.slug}`} className="kart">
      <div className="kart-gorsel"><span className="kart-zil" title="Ürün sayfasında fiyat alarmı kurabilirsiniz" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22V14a8 8 0 0 1 16 0v8l2 3H6z" /><path d="M13 28h6" /></svg></span>{u.gorsel ? <img src={u.gorsel} referrerPolicy="no-referrer" alt="" loading="lazy" /> : <span className="soluk kucuk">Görsel yok</span>}</div>
      <div className="kart-govde">
        <div className="kart-ad"><span className="kart-marka">{u.marka}</span> {u.model} {u.varyant && <span className="kart-varyant">{u.varyant}</span>}</div>
        <div className="kart-ozet">{kisaOzet(u.ozellikler)}</div>
        <div className="kart-alt">
          <span className="kart-fiyat fiyat">{tl(u.fiyat)}</span>
          <DegisimRozeti u={u} />
        </div>
        <MiniOlcek fiyat={u.fiyat} enDusuk={u.enDusuk30} enYuksek={u.enYuksek30} />
        <div className="kart-magaza">{u.magaza_sayisi > 1 ? <><b>{u.magaza_sayisi} fiyat</b> arasında en ucuz</> : "1 mağazada"}</div>
      </div>
    </Link>
  );
}
