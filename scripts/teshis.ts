// Geçici: ana sayfa vitrin sorgusunun süresi ve sonucu (vitrin-deneme dalı).
import { vitrinler } from "../lib/sorgular.ts";
import { altSluglar } from "../lib/katalog/agac.ts";
import { kapat } from "../lib/db.ts";
for (let i = 0; i < 2; i++) {
  const t = Date.now();
  const v = await vitrinler({
    telefon: { sluglar: ["akilli-telefon"], adet: 10 }, bilgisayar: { sluglar: ["dizustu-bilgisayar", "masaustu-bilgisayar", "all-in-one-bilgisayar", "oyun-bilgisayari", "mini-pc", "tablet"], adet: 10 },
    robotik: { sluglar: ["gelistirme-karti", "sensor-modul", "motor-surucu", "robot-kiti"], adet: 3 }, pet: { sluglar: altSluglar("pet-shop"), adet: 3 },
    kozmetik: { sluglar: altSluglar("kozmetik-kisisel-bakim"), adet: 3 },
  });
  console.log(`tur ${i + 1}: ${Date.now() - t} ms`);
  for (const [g, l] of Object.entries(v)) console.log(g, l.length, l.slice(0, 10).map((u) => `${u.marka} ${u.model} ${u.fiyat} (${u.magaza_sayisi})`).join(" | "));
}
await kapat();
