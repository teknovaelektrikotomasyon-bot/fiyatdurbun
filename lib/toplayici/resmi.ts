// Üreticilerin resmî Türkiye mağazaları (Apple, Samsung). Ürün sayfaları tek tek değil, model sayfası başına
// tüm hafıza seçenekleri okunur; okuyucular Avrupa fiyatlarıyla ortaktır (lib/avrupa).
import { getir } from "./istek.ts";
import type { OkunanTeklif } from "./okuyucu.ts";
import { appleModelSayfalari, appleSayfaOku } from "../avrupa/apple.ts";
import { samsungBuyOku, samsungListeOku } from "../avrupa/samsung.ts";
import type { DisSatir } from "../avrupa/ulkeler.ts";

const hafizaMetni = (gb: number) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);
const teklife = (s: DisSatir): OkunanTeklif => ({
  url: s.url, ad: `${s.marka} ${s.model} ${hafizaMetni(s.depolamaGb)}`, marka: s.marka,
  // Apple'da tüm hafıza seçenekleri aynı adresi paylaşır; teklif anahtarı model+hafıza olmalı.
  sku: `${s.model}|${s.depolamaGb}`.toLowerCase(),
  fiyat: s.fiyat, para: s.para, stokta: true, gorsel: s.gorsel,
});

export async function appleTurkiye(bekleme: number): Promise<OkunanTeklif[]> {
  const ana = await getir("https://www.apple.com/tr/shop/buy-iphone", bekleme);
  if (ana.engel || ana.durum !== 200) throw new Error(`Apple TR: ${ana.engel ?? ana.durum}`);
  const sonuc: OkunanTeklif[] = [];
  for (const adres of appleModelSayfalari(ana.html, "tr")) {
    const y = await getir(adres, bekleme);
    if (y.engel || y.durum !== 200) continue;
    sonuc.push(...appleSayfaOku(y.html).filter((f) => f.para === "TRY")
      .map((f) => teklife({ marka: "Apple", model: f.model, depolamaGb: f.depolamaGb, fiyat: f.fiyat, para: f.para, url: adres, gorsel: f.gorsel })));
  }
  return sonuc;
}

export async function samsungTurkiye(bekleme: number): Promise<OkunanTeklif[]> {
  const liste = await getir("https://www.samsung.com/tr/smartphones/all-smartphones/", bekleme);
  if (liste.engel || liste.durum !== 200) throw new Error(`Samsung TR: ${liste.engel ?? liste.durum}`);
  const { buySayfalari, tekiller } = samsungListeOku(liste.html);
  const sonuc = tekiller.filter((s) => s.para === "TRY").map(teklife);
  for (const adres of buySayfalari) {
    const y = await getir(adres, bekleme);
    if (y.engel || y.durum !== 200) continue;
    sonuc.push(...samsungBuyOku(y.html).filter((s) => s.para === "TRY").map(teklife));
  }
  return sonuc;
}
