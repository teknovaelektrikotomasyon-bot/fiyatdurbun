import { tl } from "@/lib/sorgular.ts";

const RENK = ["#173f5f", "#e9a400", "#0a8754", "#8e5bb5", "#c7372f", "#3b6f8f"];

// Mağaza başına günlük en düşük fiyat, basamaklı çizgi. Sunucuda SVG olarak çizilir (JS gerekmez).
export function FiyatGrafigi({ veri }: { veri: { gun: string; magaza: string; fiyat: number }[] }) {
  const gunler = [...new Set(veri.map((v) => v.gun))].sort();
  if (gunler.length < 2) return <p className="soluk kucuk" style={{ padding: "0 18px 16px" }}>Grafik için en az iki günlük veri gerekiyor. Fiyatlar her gün birkaç kez okunuyor; grafik kendiliğinden dolacak.</p>;
  const magazalar = [...new Set(veri.map((v) => v.magaza))];
  const G = 760, Y = 240, sol = 64, sag = 12, ust = 12, alt = 28;
  const fiyatlar = veri.map((v) => v.fiyat);
  let min = Math.min(...fiyatlar), max = Math.max(...fiyatlar);
  const pay = (max - min || max * 0.05) * 0.15; min -= pay; max += pay;
  const t0 = Date.parse(gunler[0]), t1 = Date.parse(gunler[gunler.length - 1]);
  const x = (g: string) => sol + ((Date.parse(g) - t0) / (t1 - t0 || 1)) * (G - sol - sag);
  const y = (f: number) => ust + (1 - (f - min) / (max - min)) * (Y - ust - alt);
  const adim = (max - min) / 4;
  const etiketGunleri = gunler.filter((_, i) => i % Math.ceil(gunler.length / 6) === 0);
  return (
    <>
      <div className="grafik">
        <svg viewBox={`0 0 ${G} ${Y}`} role="img" aria-label="Mağazalara göre fiyat geçmişi">
          {[0, 1, 2, 3, 4].map((i) => {
            const f = min + adim * i;
            return <g key={i}><line x1={sol} x2={G - sag} y1={y(f)} y2={y(f)} stroke="#e3e8ec" /><text x={sol - 8} y={y(f) + 4} textAnchor="end" fontSize="11" fill="#5a6975">{tl(Math.round(f / 100) * 100).replace(" TL", "")}</text></g>;
          })}
          {etiketGunleri.map((g) => <text key={g} x={x(g)} y={Y - 8} fontSize="11" fill="#5a6975" textAnchor="middle">{new Date(g).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</text>)}
          {magazalar.map((m, i) => {
            const n = veri.filter((v) => v.magaza === m);
            const d = n.map((v, j) => (j === 0 ? `M${x(v.gun)},${y(v.fiyat)}` : `H${x(v.gun)}V${y(v.fiyat)}`)).join("");
            return <path key={m} d={d} fill="none" stroke={RENK[i % RENK.length]} strokeWidth="2.2" strokeLinejoin="round" />;
          })}
        </svg>
      </div>
      <div className="lejant">{magazalar.map((m, i) => <span key={m}><i style={{ background: RENK[i % RENK.length] }} />{m}</span>)}</div>
    </>
  );
}
