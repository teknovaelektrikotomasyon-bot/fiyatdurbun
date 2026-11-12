// Avrupa fiyatları: Apple'ın resmi ülke mağazalarındaki iPhone fiyatlarını okur, bizim ürünlerle eşleştirir ve kaydeder.
// Uydurma ya da tahmini fiyat yoktur: her satır, bağlantısı verilen sayfada o gün okunan fiyattır.
// Kullanım: node --experimental-strip-types scripts/avrupa.ts [--kuru] (--kuru: veritabanına yazmadan yalnızca listeler)
import { getir } from "../lib/toplayici/istek.ts";
import { APPLE_ULKELERI, appleModelSayfalari, appleSayfaOku } from "../lib/avrupa/apple.ts";
import { tcmbKuru } from "../lib/avrupa/kur.ts";
import { eslesmeAnahtari } from "../lib/katalog/telefon.ts";

const kuru = process.argv.includes("--kuru");
const kur = await tcmbKuru("EUR");
console.log(`TCMB EUR döviz satış: ${kur.satis} (${kur.tarih})`);

type Satir = { anahtar: string; model: string; depolamaGb: number; ulke: string; fiyat: number; para: string; url: string };
const satirlar: Satir[] = [];
for (const u of APPLE_ULKELERI) {
  const ana = await getir(`https://www.apple.com/${u.yol}/shop/buy-iphone`);
  if (ana.engel || ana.durum !== 200) { console.log(`${u.kod}: ana sayfa okunamadı (${ana.engel ?? ana.durum})`); continue; }
  for (const sayfa of appleModelSayfalari(ana.html, u.yol)) {
    const y = await getir(sayfa);
    if (y.engel || y.durum !== 200) { console.log(`${u.kod} ${sayfa}: ${y.engel ?? y.durum}`); continue; }
    const fiyatlar = appleSayfaOku(y.html);
    for (const f of fiyatlar) satirlar.push({ anahtar: eslesmeAnahtari("Apple", f.model, f.depolamaGb), model: f.model, depolamaGb: f.depolamaGb, ulke: u.kod, fiyat: f.fiyat, para: f.para, url: sayfa });
    console.log(`${u.kod} ${sayfa.split("/").pop()}: ${fiyatlar.map((f) => `${f.model} ${f.depolamaGb}GB=${f.fiyat}${f.para}`).join(", ") || "fiyat yok"}`);
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
const urunler = new Map((await q<{ id: number; eslesme_anahtari: string }>(
  "select u.id, u.eslesme_anahtari from urun u join marka m on m.id = u.marka_id where m.ad = 'Apple'")).map((x) => [x.eslesme_anahtari, x.id]));
let yazilan = 0;
const eslesmeyen = new Set<string>();
for (const s of satirlar) {
  const id = urunler.get(s.anahtar);
  if (!id) { eslesmeyen.add(`${s.model} ${s.depolamaGb}GB`); continue; }
  if (s.para !== kur.para) continue;
  await q(`insert into dis_fiyat (urun_id, ulke, kaynak, url, fiyat, para, kur, kur_tarihi) values ($1,$2,'apple',$3,$4,$5,$6,$7)
           on conflict (urun_id, ulke, kaynak) do update set url=excluded.url, fiyat=excluded.fiyat, para=excluded.para, kur=excluded.kur, kur_tarihi=excluded.kur_tarihi, guncelleme=now()`,
    [id, s.ulke, s.url, s.fiyat, s.para, kur.satis, kur.tarih]);
  yazilan++;
}
console.log(`${yazilan} fiyat yazıldı. Bizde olmayan modeller: ${[...eslesmeyen].join(", ") || "yok"}`);
await kapat();
