// Avrupa fiyatları: üreticilerin resmî ülke mağazalarındaki (Apple, Samsung) telefon fiyatlarını okur,
// bizim ürünlerle eşleştirir ve kaydeder. Uydurma ya da tahmini fiyat yoktur: her satır, bağlantısı verilen
// sayfada o gün okunan fiyattır. Emin olunamayan eşleşme yazılmaz.
// Kullanım: node --experimental-strip-types scripts/avrupa.ts [--kuru] (--kuru: veritabanına yazmadan yalnızca listeler)
import { getir } from "../lib/toplayici/istek.ts";
import { appleModelSayfalari, appleSayfaOku } from "../lib/avrupa/apple.ts";
import { samsungBuyOku, samsungListeOku } from "../lib/avrupa/samsung.ts";
import { AVRUPA_ULKELERI, type DisSatir } from "../lib/avrupa/ulkeler.ts";
import { tcmbKuru } from "../lib/avrupa/kur.ts";
import { eslesmeAnahtari } from "../lib/katalog/telefon.ts";

const kuru = process.argv.includes("--kuru");
const kur = await tcmbKuru("EUR");
console.log(`TCMB EUR döviz satış: ${kur.satis} (${kur.tarih})`);

type Satir = DisSatir & { ulke: string; kaynak: string };
const satirlar: Satir[] = [];
const ozet = (f: DisSatir[]) => f.map((x) => `${x.model} ${x.depolamaGb}GB=${x.fiyat}`).join(", ") || "fiyat yok";

async function sayfa(url: string) {
  const y = await getir(url);
  if (y.engel || y.durum !== 200) { console.log(`  okunamadı ${url}: ${y.engel ?? y.durum}`); return null; }
  return y.html;
}

for (const u of AVRUPA_ULKELERI) {
  // Apple
  const appleAna = await sayfa(`https://www.apple.com/${u.yol}/shop/buy-iphone`);
  for (const adres of appleAna ? appleModelSayfalari(appleAna, u.yol) : []) {
    const html = await sayfa(adres);
    if (!html) continue;
    const f = appleSayfaOku(html).map((x) => ({ marka: "Apple", model: x.model, depolamaGb: x.depolamaGb, fiyat: x.fiyat, para: x.para, url: adres }));
    satirlar.push(...f.map((x) => ({ ...x, ulke: u.kod, kaynak: "apple" })));
    console.log(`${u.kod} apple ${adres.split("/").pop()}: ${ozet(f)}`);
  }
  // Samsung
  const samsungListe = await sayfa(`https://www.samsung.com/${u.yol}/smartphones/all-smartphones/`);
  if (samsungListe) {
    const { buySayfalari, tekiller } = samsungListeOku(samsungListe);
    satirlar.push(...tekiller.map((x) => ({ ...x, ulke: u.kod, kaynak: "samsung" })));
    console.log(`${u.kod} samsung liste: ${ozet(tekiller)}`);
    for (const adres of buySayfalari) {
      const html = await sayfa(adres);
      if (!html) continue;
      const f = samsungBuyOku(html);
      satirlar.push(...f.map((x) => ({ ...x, ulke: u.kod, kaynak: "samsung" })));
      console.log(`${u.kod} samsung ${adres.split("/").slice(-3, -2)[0]}: ${ozet(f)}`);
    }
  }
}
if (!satirlar.length) throw new Error("Hiç fiyat okunamadı; sayfa yapısı değişmiş olabilir.");

if (kuru) { console.log(`${satirlar.length} satır (kuru çalışma, yazılmadı)`); process.exit(0); }

const { q, kapat } = await import("../lib/db.ts");
await q(`create table if not exists dis_fiyat (
  id serial primary key,
  urun_id int not null references urun(id) on delete cascade,
  ulke text not null, kaynak text not null, url text not null,
  fiyat numeric(12,2) not null, para text not null,
  kur numeric(12,4) not null, kur_tarihi date not null,
  guncelleme timestamptz not null default now(),
  unique (urun_id, ulke, kaynak))`);

// Eşleştirme: marka|model|hafıza. Samsung'da "Z" öneki mağazadan mağazaya yazılıp yazılmadığı için atılır
// ("Galaxy Z Fold8" = "Galaxy Fold8"); 5G/LTE ve Enterprise Edition farkları ayrı ürün sayılır, eşleştirilmez.
const norm = (anahtar: string) => anahtar.replace(/^(samsung\|galaxy) z /, "$1 ");
const urunler = new Map<string, number[]>();
for (const x of await q<{ id: number; eslesme_anahtari: string }>(
  "select u.id, u.eslesme_anahtari from urun u join marka m on m.id = u.marka_id where m.ad in ('Apple','Samsung') and u.eslesme_anahtari is not null")) {
  const k = norm(x.eslesme_anahtari);
  urunler.set(k, [...(urunler.get(k) ?? []), x.id]);
}
let yazilan = 0;
const eslesmeyen = new Set<string>();
for (const s of satirlar) {
  const idler = urunler.get(norm(eslesmeAnahtari(s.marka, s.model, s.depolamaGb)));
  if (!idler) { eslesmeyen.add(`${s.marka} ${s.model} ${s.depolamaGb}GB`); continue; }
  if (s.para !== kur.para) continue;
  for (const id of idler) {
    await q(`insert into dis_fiyat (urun_id, ulke, kaynak, url, fiyat, para, kur, kur_tarihi) values ($1,$2,$3,$4,$5,$6,$7,$8)
             on conflict (urun_id, ulke, kaynak) do update set url=excluded.url, fiyat=excluded.fiyat, para=excluded.para, kur=excluded.kur, kur_tarihi=excluded.kur_tarihi, guncelleme=now()`,
      [id, s.ulke, s.kaynak, s.url, s.fiyat, s.para, kur.satis, kur.tarih]);
    yazilan++;
  }
}
console.log(`${yazilan} fiyat yazıldı. Bizde olmayan modeller: ${[...eslesmeyen].join(", ") || "yok"}`);
await kapat();
