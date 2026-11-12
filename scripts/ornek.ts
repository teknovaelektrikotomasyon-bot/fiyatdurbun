// Aday mağazalardan örnek ürünler: barkod, marka, kategori yolu ve fiyatın gerçekten okunduğunu görmek için.
import { robotsAl, getir } from "../lib/toplayici/istek.ts";
import { urunOku } from "../lib/toplayici/okuyucu.ts";
import { haritaAdresleri } from "../lib/toplayici/haritalar.ts";

const ADAY: { ad: string; site: string; filtre: RegExp }[] = [
  { ad: "itopya", site: "https://www.itopya.com", filtre: /itopya\.com\/[^/]+_u\d+/ },
  { ad: "Bosch Ev", site: "https://www.bosch-home.com.tr", filtre: /bosch-home\.com\.tr\/tr\/product\/[^/]+\/[^/]+\/.+/ },
  { ad: "Karaca", site: "https://www.karaca.com", filtre: /karaca\.com\/[^/]+-\d{5,}$|karaca\.com\/urun\// },
  { ad: "English Home", site: "https://www.englishhome.com", filtre: /englishhome\.com\/[a-z0-9-]+-\d{4,}$/ },
  { ad: "Madame Coco", site: "https://www.madamecoco.com", filtre: /madamecoco\.com\/[a-z0-9-]+\/$/ },
  { ad: "Migros", site: "https://www.migros.com.tr", filtre: /migros\.com\.tr\/[a-z0-9-]+-p-[0-9a-f]+$/ },
  { ad: "Macrocenter", site: "https://www.macrocenter.com.tr", filtre: /macrocenter\.com\.tr\/[a-z0-9-]+-p-[0-9a-f]+$/ },
  { ad: "Rossmann", site: "https://www.rossmann.com.tr", filtre: /rossmann\.com\.tr\/[a-z0-9-]+-p-[a-z0-9]+$/ },
  { ad: "Joker", site: "https://www.joker.com.tr", filtre: /joker\.com\.tr\/products\// },
  { ad: "Pet Burada", site: "https://www.petburada.com", filtre: /petburada\.com\/[a-z0-9-]+$/ },
  { ad: "Teknostore", site: "https://www.teknostore.com", filtre: /teknostore\.com\/[a-z0-9-]+$/ },
  { ad: "Evidea", site: "https://www.evidea.com", filtre: /evidea\.com\/[a-z0-9-]+-\d+\/?$|evidea\.com\/.*\/p\// },
  { ad: "Bellona", site: "https://www.bellona.com.tr", filtre: /bellona\.com\.tr\/urun\// },
  { ad: "Tekzen", site: "https://www.tekzen.com.tr", filtre: /tekzen\.com\.tr\/[a-z0-9-]+-\d+$/ },
  { ad: "Şok", site: "https://www.sokmarket.com.tr", filtre: /sokmarket\.com\.tr\/[a-z0-9-]+-p-\d+$/ },
  { ad: "Petlebi", site: "https://www.petlebi.com", filtre: /petlebi\.com\/[a-z0-9-]+\/[a-z0-9-]+\.html$|petlebi\.com\/urun\// },
];

for (const a of ADAY) {
  const r = await robotsAl(a.site);
  const adresler = await haritaAdresleri(a.site, r.siteHaritalari, a.filtre, 50000, 1500, 25);
  console.log(`\n## ${a.ad}: ${adresler.length} ürün adresi`);
  const ornekler = [0.1, 0.35, 0.6, 0.85].map((x) => adresler[Math.floor(adresler.length * x)]).filter(Boolean);
  for (const u of ornekler) {
    const y = await getir(u, 2000);
    const t = y.engel ? null : urunOku(y.html, u);
    console.log(JSON.stringify(t ? { ad: t.ad, marka: t.marka, gtin: t.gtin, sku: t.sku, fiyat: t.fiyat, para: t.para, stok: t.stokta, yol: t.kategoriYolu, gorsel: !!t.gorsel } : { url: u, engel: y.engel ?? null, durum: y.durum, fiyat: "yok" }));
  }
}
