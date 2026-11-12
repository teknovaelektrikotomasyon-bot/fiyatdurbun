import { tl } from "@/lib/sorgular.ts";

const RENK = ["#102a3a", "#e8a317", "#0e7c4a", "#7a5cc2", "#c2412d", "#4f86a6"];

// Mağaza başına günlük en düşük fiyat, basamaklı çizgi. Sunucuda çizilir (JS gerekmez).
// Çizgiler esneyen bir SVG'de, yazılar HTML'de durur; böylece telefonda da okunur boyutta kalırlar.
export function FiyatGrafigi({ veri }: { veri: { gun: string; magaza: string; fiyat: number }[] }) {
  const gunler = [...new Set(veri.map((v) => v.gun))].sort();
  if (gunler.length < 2) return <p className="soluk kucuk grafik-bos">Grafik için en az iki günlük veri gerekiyor. Fiyatlar her gün birkaç kez okunuyor, grafik kendiliğinden dolacak.</p>;
  const magazalar = [...new Set(veri.map((v) => v.magaza))];
  const fiyatlar = veri.map((v) => v.fiyat);
  let min = Math.min(...fiyatlar), max = Math.max(...fiyatlar);
  const pay = (max - min || max * 0.05) * 0.12; min -= pay; max += pay;
  const t0 = Date.parse(gunler[0]), t1 = Date.parse(gunler[gunler.length - 1]);
  const x = (g: string) => ((Date.parse(g) - t0) / (t1 - t0 || 1)) * 100;
  const y = (f: number) => (1 - (f - min) / (max - min)) * 100;
  const cizgiler = [0, 1, 2, 3, 4].map((i) => min + ((max - min) / 4) * i);
  const etiketGunleri = gunler.filter((_, i) => i % Math.ceil(gunler.length / 5) === 0);
  return (
    <>
      <div className="grafik" role="img" aria-label="Mağazalara göre fiyat geçmişi">
        <div className="grafik-alan">
          {cizgiler.map((f) => (
            <div key={f} className="grafik-yatay" style={{ top: `${y(f)}%` }}><span className="fiyat">{tl(Math.round(f / 100) * 100).replace(" TL", "")}</span></div>
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {magazalar.map((m, i) => {
              const n = veri.filter((v) => v.magaza === m);
              const d = n.map((v, j) => (j === 0 ? `M${x(v.gun)},${y(v.fiyat)}` : `H${x(v.gun)}V${y(v.fiyat)}`)).join("");
              return <path key={m} d={d} fill="none" stroke={RENK[i % RENK.length]} strokeWidth="2.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
        </div>
        <div className="grafik-gunler">
          {etiketGunleri.map((g) => <span key={g} style={{ left: `${x(g)}%` }}>{new Date(g).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>)}
        </div>
      </div>
      {magazalar.length > 1 && <div className="lejant">{magazalar.map((m, i) => <span key={m}><i style={{ background: RENK[i % RENK.length] }} />{m}</span>)}</div>}
    </>
  );
}
