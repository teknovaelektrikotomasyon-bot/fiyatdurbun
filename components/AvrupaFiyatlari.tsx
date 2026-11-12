import { tl, type DisFiyat } from "@/lib/sorgular.ts";
import { KAYNAK_ADI as KAYNAK, ULKE_ADI as ULKE } from "@/lib/avrupa/ulkeler.ts";

// Ürünün Avrupa'daki resmî mağaza fiyatları. Her satır o gün okunan gerçek fiyattır ve kaynağına bağlanır.
const euro = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const tarih = (s: string) => new Date(s).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });

export function avrupaOzeti(satirlar: DisFiyat[], trFiyat: number | null) {
  if (!satirlar.length) return null;
  const enUcuz = satirlar[0];
  const tlKarsilik = enUcuz.fiyat * enUcuz.kur;
  const fark = trFiyat != null ? (trFiyat - tlKarsilik) / tlKarsilik : null;
  return { enUcuz, tlKarsilik, fark };
}

export function AvrupaFiyatlari({ satirlar, trFiyat, urunAdi }: { satirlar: DisFiyat[]; trFiyat: number | null; urunAdi: string }) {
  const oz = avrupaOzeti(satirlar, trFiyat);
  if (!oz) return null;
  const ort = satirlar.reduce((a, s) => a + s.fiyat, 0) / satirlar.length;
  const { kur, kur_tarihi } = satirlar[0];
  const okundu = satirlar.map((s) => s.guncelleme).sort().at(-1)!;
  return (
    <section className="kutu bolum avrupa" id="avrupa" aria-labelledby="avrupa-baslik">
      <div className="bolum-baslik">
        <h2 id="avrupa-baslik">Avrupa&apos;da resmî fiyatı</h2>
        <span className="kucuk soluk">Avrupa ortalaması {euro(ort)} ≈ {tl(Math.round(ort * kur))}</span>
      </div>
      {oz.fark != null && (
        <p className="avrupa-ozet">
          {urunAdi} Türkiye&apos;de en ucuz <b>{tl(trFiyat)}</b>. En ucuz olduğu {ULKE[oz.enUcuz.ulke]}&apos;da <b>{euro(oz.enUcuz.fiyat)}</b>, yani yaklaşık <b>{tl(Math.round(oz.tlKarsilik))}</b>.{" "}
          {Math.abs(oz.fark) < 0.01 ? "Fiyatlar neredeyse aynı." : oz.fark > 0
            ? <>Türkiye fiyatı <b className="artis-yazi">%{(oz.fark * 100).toFixed(0)} daha yüksek</b>.</>
            : <>Türkiye fiyatı <b className="dusus-yazi">%{(-oz.fark * 100).toFixed(0)} daha düşük</b>.</>}
        </p>
      )}
      <table className="teklif-tablo avrupa-tablo">
        <thead><tr><th>Ülke</th><th className="sag">Fiyat</th><th className="sag">TL karşılığı</th>{trFiyat != null && <th className="sag">Türkiye&apos;ye göre</th>}<th></th></tr></thead>
        <tbody>
          {satirlar.map((s) => {
            const tlk = s.fiyat * s.kur;
            const f = trFiyat != null ? (trFiyat - tlk) / tlk : null;
            return (
              <tr key={s.ulke + s.kaynak}>
                <td><div className="magaza-ad">{ULKE[s.ulke] ?? s.ulke}</div><div className="kucuk soluk">{KAYNAK[s.kaynak] ?? s.kaynak}</div></td>
                <td className="sag"><span className="teklif-fiyat fiyat">{euro(s.fiyat)}</span></td>
                <td className="sag fiyat">≈ {tl(Math.round(tlk))}</td>
                {f != null && <td className="sag kucuk">{Math.abs(f) < 0.01 ? "aynı" : f > 0 ? <span className="artis-yazi">TR %{(f * 100).toFixed(0)} pahalı</span> : <span className="dusus-yazi">TR %{(-f * 100).toFixed(0)} ucuz</span>}</td>}
                <td className="sag"><a className="dugme ikincil" href={s.url} target="_blank" rel="nofollow noopener noreferrer">{KAYNAK[s.kaynak] ?? "Sitede"}&apos;da gör<span className="gorunmez"> ({ULKE[s.ulke]}, yeni sekmede açılır)</span></a></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="avrupa-not">
        Fiyatlar, üreticinin resmî ülke mağazalarındaki KDV dahil fiyatlardır; son okuma {tarih(okundu)}. TL karşılığı TCMB döviz satış kuruyla hesaplandı: 1 € = {kur.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} TL ({tarih(kur_tarihi)}).
        Yurt dışından getirilen telefonlar için Türkiye&apos;de IMEI kayıt harcı ayrıca ödenir; karşılaştırma bu harcı içermez.
      </p>
    </section>
  );
}
