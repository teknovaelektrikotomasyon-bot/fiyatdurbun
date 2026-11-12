import { tl } from "@/lib/sorgular.ts";

// İmza öğe: bugünkü en ucuz fiyat, son 30 günün en düşüğü ile en yükseği arasında nerede?
export function Olcek({ fiyat, gecmis, magazaSayisi }: { fiyat: number; gecmis: { gun: string; fiyat: number }[]; magazaSayisi: number }) {
  const sinir = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const son30 = gecmis.filter((g) => g.gun >= sinir).map((g) => g.fiyat).concat(fiyat);
  const gunSayisi = new Set(gecmis.map((g) => g.gun)).size;
  const min = Math.min(...son30), max = Math.max(...son30);
  const konum = max > min ? (fiyat - min) / (max - min) : 0.5;
  let yorum: React.ReactNode;
  if (gunSayisi < 7) yorum = <>Bu ürünün fiyatını {gunSayisi} gündür izliyoruz. Takip edin, düşünce haber verelim.</>;
  else if (fiyat <= min) yorum = <><b>Son 30 günün en düşük fiyatı.</b> Almayı düşünüyorsanız iyi bir an.</>;
  else yorum = <>Son 30 günde en düşük <b>{tl(min)}</b> görüldü; bugün <b>%{(((fiyat - min) / min) * 100).toFixed(1)}</b> daha pahalı.</>;
  return (
    <div className="olcek">
      <div className="olcek-ust">
        <div>
          <div className="kucuk soluk">{magazaSayisi} mağazanın en ucuzu</div>
          <div className="olcek-fiyat fiyat">{tl(fiyat)}</div>
        </div>
      </div>
      <div className="olcek-cubuk" role="img" aria-label={`Son 30 gün: en düşük ${tl(min)}, en yüksek ${tl(max)}`}>
        <span className="olcek-mercek" style={{ left: `${(konum * 100).toFixed(1)}%` }} />
      </div>
      <div className="olcek-alt"><span>30 günün en düşüğü {tl(min)}</span><span>en yükseği {tl(max)}</span></div>
      <p className="olcek-yorum">{yorum}</p>
    </div>
  );
}
