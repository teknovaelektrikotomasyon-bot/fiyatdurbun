// TCMB günlük kur dosyası (resmî kaynak): https://www.tcmb.gov.tr/kurlar/today.xml
// Avrupa fiyatlarını TL'ye çevirirken "döviz satış" kuru kullanılır; tarih de saklanır ve sayfada gösterilir.
import { getir } from "../toplayici/istek.ts";

export type Kur = { para: string; satis: number; tarih: string };

export function tcmbOku(xml: string, para: string): Kur | null {
  const tarih = /Tarih="(\d{2})\.(\d{2})\.(\d{4})"/.exec(xml);
  const blok = new RegExp(`<Currency[^>]*CurrencyCode="${para}"[^>]*>([\\s\\S]*?)</Currency>`).exec(xml);
  const satis = blok && /<ForexSelling>([\d.]+)<\/ForexSelling>/.exec(blok[1]);
  if (!tarih || !satis) return null;
  return { para, satis: Number(satis[1]), tarih: `${tarih[3]}-${tarih[2]}-${tarih[1]}` };
}

export async function tcmbKuru(para = "EUR"): Promise<Kur> {
  const y = await getir("https://www.tcmb.gov.tr/kurlar/today.xml", 1000);
  if (y.engel || y.durum !== 200) throw new Error(`TCMB kuru okunamadı: ${y.engel ?? y.durum}`);
  const k = tcmbOku(y.html, para);
  if (!k) throw new Error("TCMB dosyasında kur bulunamadı");
  return k;
}
