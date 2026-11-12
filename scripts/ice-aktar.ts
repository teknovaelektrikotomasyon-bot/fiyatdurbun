// Toplayıcının JSONL çıktısını veritabanına aktarır (yerel deneme ya da geçmiş yükleme için).
// Kullanım: node --experimental-strip-types scripts/ice-aktar.ts veri/okunan.jsonl
import { readFileSync } from "node:fs";
import { katalogHazirla, kaydet } from "../lib/aktarim.ts";
import { kapat } from "../lib/db.ts";

await katalogHazirla();
let n = 0, eslesmeyen = 0;
for (const satir of readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean)) {
  const { magaza, kategori, gun, ...kayit } = JSON.parse(satir);
  const r = await kaydet(magaza, kategori, kayit, gun);
  n++; if (!r.urunId) eslesmeyen++;
}
console.log(`${n} teklif aktarıldı, ${eslesmeyen} eşleşmedi`);
await kapat();
