"use client";
// Filtre kenar çubuğu. Seçimler adres çubuğuna yazılır (?marka=apple&depolama_gb=256), böylece her filtreli liste paylaşılabilir ve Google'a açılabilir.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Oz = { anahtar: string; ad: string; tur: string; birim: string | null; filtre: string };
type Props = {
  ozellikler: Oz[];
  markalar: { ad: string; n: number }[];
  secenek: Record<string, { deger: string; n: number }[]>;
  aralik: Record<string, { min: number; max: number }>;
  fiyat: { min: number; max: number } | null;
};

const bicim = (o: Oz, d: string) => {
  if (o.tur === "evet_hayir") return d === "true" ? "Var" : "Yok";
  if (o.birim === "GB" && Number(d) >= 1024) return `${Number(d) / 1024} TB`;
  return o.birim ? `${d} ${o.birim}` : d;
};

export function Filtreler({ ozellikler, markalar, secenek, aralik, fiyat }: Props) {
  const yol = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const [bekliyor, gecis] = useTransition();
  const [acik, setAcik] = useState(false); // yalnızca dar ekranda: filtreler bir düğmenin arkasında durur
  const git = (p: URLSearchParams) => gecis(() => router.replace(`${yol}?${p}`, { scroll: false }));

  const coklu = (anahtar: string, deger: string) => {
    const p = new URLSearchParams(sp);
    const set = new Set((p.get(anahtar) ?? "").split(",").filter(Boolean));
    set.has(deger) ? set.delete(deger) : set.add(deger);
    set.size ? p.set(anahtar, [...set].join(",")) : p.delete(anahtar);
    git(p);
  };
  const tek = (anahtar: string, deger: string | null) => {
    const p = new URLSearchParams(sp);
    deger ? p.set(anahtar, deger) : p.delete(anahtar);
    git(p);
  };
  const secili = (anahtar: string, d: string) => (sp.get(anahtar) ?? "").split(",").includes(d);
  const herhangi = [...sp.keys()].some((k) => k !== "sirala");

  return (
    <aside className="kutu filtreler" aria-busy={bekliyor} data-acik={acik || undefined} style={{ opacity: bekliyor ? 0.7 : 1 }}>
      <button type="button" className="filtre-dugme" aria-expanded={acik} onClick={() => setAcik(!acik)}>
        {acik ? "Filtreleri gizle" : `Filtrele${herhangi ? ` (${[...sp.keys()].filter((k) => k !== "sirala").length} seçili)` : ""}`}
      </button>
      <fieldset>
        <legend>Fiyat</legend>
        <Aralik anahtar="fiyat" deger={sp.get("fiyat")} ipucu={fiyat ? [Math.floor(fiyat.min), Math.ceil(fiyat.max)] : undefined} birim="TL" uygula={tek} />
      </fieldset>
      <fieldset>
        <legend>Marka</legend>
        {markalar.map((m) => (
          <label key={m.ad} className="secim">
            <input type="checkbox" checked={secili("marka", m.ad.toLowerCase())} onChange={() => coklu("marka", m.ad.toLowerCase())} />
            {m.ad}<span className="n">{m.n}</span>
          </label>
        ))}
      </fieldset>
      {ozellikler.filter((o) => o.filtre !== "yok").map((o) => {
        const s = secenek[o.anahtar] ?? [];
        if (o.filtre === "coklu" && s.length > 1) return (
          <fieldset key={o.anahtar}>
            <legend>{o.ad}</legend>
            <div className="cipler">
              {s.map((x) => (
                <button type="button" key={x.deger} className="cip" aria-pressed={secili(o.anahtar, x.deger)} onClick={() => coklu(o.anahtar, x.deger)}>
                  {bicim(o, x.deger)}
                </button>
              ))}
            </div>
          </fieldset>
        );
        if (o.filtre === "evet_hayir" && s.some((x) => x.deger === "true")) return (
          <fieldset key={o.anahtar}>
            <legend>{o.ad}</legend>
            <label className="secim">
              <input type="checkbox" checked={sp.get(o.anahtar) === "1"} onChange={(e) => tek(o.anahtar, e.target.checked ? "1" : null)} />
              {o.ad} olsun<span className="n">{s.find((x) => x.deger === "true")?.n}</span>
            </label>
          </fieldset>
        );
        if (o.filtre === "aralik" && aralik[o.anahtar]) return (
          <fieldset key={o.anahtar}>
            <legend>{o.ad}</legend>
            <Aralik anahtar={o.anahtar} deger={sp.get(o.anahtar)} ipucu={[aralik[o.anahtar].min, aralik[o.anahtar].max]} birim={o.birim ?? ""} uygula={tek} />
          </fieldset>
        );
        return null;
      })}
      {herhangi && <p><a className="temizle" href={yol}>Tüm filtreleri temizle</a></p>}
    </aside>
  );
}

function Aralik({ anahtar, deger, ipucu, birim, uygula }: { anahtar: string; deger: string | null; ipucu?: [number, number]; birim: string; uygula: (a: string, d: string | null) => void }) {
  const [a0, b0] = (deger ?? "-").split("-");
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const gonder = () => { const yeni = a || b ? `${a}-${b}` : null; if (yeni !== deger) uygula(anahtar, yeni); };
  return (
    <form className="aralik" onSubmit={(e) => { e.preventDefault(); gonder(); }}>
      <input inputMode="decimal" aria-label={`En az ${birim}`} placeholder={ipucu ? `${ipucu[0]}` : "en az"} value={a} onChange={(e) => setA(e.target.value)} onBlur={gonder} />
      <span className="soluk">–</span>
      <input inputMode="decimal" aria-label={`En çok ${birim}`} placeholder={ipucu ? `${ipucu[1]}` : "en çok"} value={b} onChange={(e) => setB(e.target.value)} onBlur={gonder} />
    </form>
  );
}
