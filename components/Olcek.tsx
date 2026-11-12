import { tl } from "@/lib/sorgular.ts";

// İmza öğe: telemetre nişangâhı. Bugünkü en ucuz fiyat, son 30 günün en düşüğü ile en yükseği arasında nerede?
// Büyük hali ürün sayfasında ve ana sayfada, mini hali ürün kartlarında kullanılır.

export function konumHesapla(fiyat: number, enDusuk: number | null, enYuksek: number | null) {
  const min = Math.min(fiyat, enDusuk ?? fiyat), max = Math.max(fiyat, enYuksek ?? fiyat);
  return { min, max, konum: max > min ? (fiyat - min) / (max - min) : null };
}

function Nisangah({ konum, etiket, boyut }: { konum: number; etiket: string; boyut: "buyuk" | "mini" }) {
  return (
    <div className={`nisangah nisangah-${boyut}`} role="img" aria-label={etiket} title={etiket}>
      <div className="nisangah-cetvel" />
      <span className="nisangah-isaret" style={{ left: `${(konum * 100).toFixed(1)}%` }} />
    </div>
  );
}

export function MiniOlcek({ fiyat, enDusuk, enYuksek }: { fiyat: number | null; enDusuk: number | null; enYuksek: number | null }) {
  if (fiyat == null) return null;
  const { min, max, konum } = konumHesapla(fiyat, enDusuk, enYuksek);
  if (konum == null) return null;
  return <Nisangah boyut="mini" konum={konum} etiket={`Son 30 gün: ${tl(min)} ile ${tl(max)} arası`} />;
}

export function Olcek({ fiyat, gecmis, magazaSayisi, baslik }: { fiyat: number; gecmis: { gun: string; fiyat: number }[]; magazaSayisi: number; baslik?: React.ReactNode }) {
  const sinir = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const son30 = gecmis.filter((g) => g.gun >= sinir).map((g) => g.fiyat);
  const gunSayisi = new Set(gecmis.map((g) => g.gun)).size;
  const { min, max, konum } = konumHesapla(fiyat, son30.length ? Math.min(...son30) : null, son30.length ? Math.max(...son30) : null);

  let yorum: React.ReactNode;
  let durum: "iyi" | "orta" | "kotu" | "yeni" = "yeni";
  if (gunSayisi < 7 || konum == null) {
    yorum = <>Bu ürünün fiyatını {gunSayisi <= 1 ? "bugün izlemeye başladık" : `${gunSayisi} gündür izliyoruz`}. Ölçek her okumada netleşir; takip ederseniz düşünce haber veririz.</>;
  } else if (fiyat <= min) {
    durum = "iyi";
    yorum = <><b>Son 30 günün en düşük fiyatı.</b> Almayı düşünüyorsanız iyi bir an.</>;
  } else {
    durum = konum < 0.5 ? "orta" : "kotu";
    yorum = <>Son 30 günde en düşük <b>{tl(min)}</b> görüldü. Bugünkü fiyat bundan <b>%{(((fiyat - min) / min) * 100).toFixed(1)}</b> yüksek.</>;
  }

  return (
    <div className={`olcek olcek-${durum}`}>
      <div className="olcek-ust">
        {baslik}
        <div className="olcek-fiyat fiyat">{tl(fiyat)}</div>
        <div className="olcek-kaynak">{magazaSayisi > 1 ? `${magazaSayisi} mağazanın en ucuzu` : "1 mağazada"}</div>
      </div>
      <Nisangah boyut="buyuk" konum={konum ?? 0.5} etiket={konum == null ? "Henüz karşılaştırılacak geçmiş fiyat yok" : `Son 30 gün: en düşük ${tl(min)}, en yüksek ${tl(max)}`} />
      <div className="olcek-uclar">
        <span>{konum == null ? "30 günlük en düşük" : <>en düşük <b className="fiyat">{tl(min)}</b></>}</span>
        <span>{konum == null ? "en yüksek" : <>en yüksek <b className="fiyat">{tl(max)}</b></>}</span>
      </div>
      <p className="olcek-yorum">{yorum}</p>
    </div>
  );
}
