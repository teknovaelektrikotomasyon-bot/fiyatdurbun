// Akıllı telefon kategorisi: filtrelenebilir özellikler ve mağazaların ham özellik tablosunu bizim alanlara çeviren kurallar.
// Yeni kategori = bu dosyanın bir benzeri. Filtre arayüzü bu listeden otomatik çizilir.

export type OzellikTanimi = {
  anahtar: string; ad: string;
  tur: "sayi" | "secim" | "evet_hayir" | "metin";
  birim?: string; filtre: "aralik" | "coklu" | "evet_hayir" | "yok";
  grup: string;
  secenekler?: number[];                       // aralık yerine hazır düğmeler (ör. 128/256/512 GB)
};

export const TELEFON_OZELLIKLERI: OzellikTanimi[] = [
  { anahtar: "depolama_gb", ad: "Depolama", tur: "sayi", birim: "GB", filtre: "coklu", grup: "Bellek", secenekler: [64, 128, 256, 512, 1024, 2048] },
  { anahtar: "ram_gb", ad: "RAM", tur: "sayi", birim: "GB", filtre: "coklu", grup: "Bellek", secenekler: [4, 6, 8, 12, 16] },
  { anahtar: "ekran_inc", ad: "Ekran boyutu", tur: "sayi", birim: "inç", filtre: "aralik", grup: "Ekran" },
  { anahtar: "ekran_tipi", ad: "Ekran teknolojisi", tur: "secim", filtre: "coklu", grup: "Ekran" },
  { anahtar: "cozunurluk", ad: "Çözünürlük", tur: "metin", filtre: "yok", grup: "Ekran" },
  { anahtar: "arka_kamera_mp", ad: "Arka kamera", tur: "sayi", birim: "MP", filtre: "aralik", grup: "Kamera" },
  { anahtar: "on_kamera_mp", ad: "Ön kamera", tur: "sayi", birim: "MP", filtre: "aralik", grup: "Kamera" },
  { anahtar: "batarya_mah", ad: "Batarya", tur: "sayi", birim: "mAh", filtre: "aralik", grup: "Pil" },
  { anahtar: "islemci", ad: "İşlemci", tur: "secim", filtre: "yok", grup: "Performans" },
  { anahtar: "isletim_sistemi", ad: "İşletim sistemi", tur: "secim", filtre: "coklu", grup: "Performans" },
  { anahtar: "5g", ad: "5G", tur: "evet_hayir", filtre: "evet_hayir", grup: "Bağlantı" },
  { anahtar: "nfc", ad: "NFC", tur: "evet_hayir", filtre: "evet_hayir", grup: "Bağlantı" },
  { anahtar: "agirlik_g", ad: "Ağırlık", tur: "sayi", birim: "g", filtre: "yok", grup: "Tasarım" },
];

// Türkçe büyük/küçük harf tuzağı: "IPHONE".toLocaleLowerCase("tr") → "ıphone". Karşılaştırmada hepsini düz harfe indiriyoruz.
export function duzle(s: string) {
  return s.replace(/İ/g, "i").replace(/I/g, "i").toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9+]+/g, " ").trim();
}

const sayiAl = (s?: string) => {
  if (!s) return undefined;
  const m = s.replace(",", ".").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};
const gbAl = (s?: string) => {
  if (!s) return undefined;
  const m = s.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
  if (!m) return sayiAl(s);
  return m[2].toUpperCase() === "TB" ? Number(m[1]) * 1024 : Number(m[1]);
};
const varMi = (s?: string) => (s == null ? undefined : /var|evet|destekl|yes|\bvar\b/i.test(s) && !/yok|hay[ıi]r/i.test(s));

const MARKALAR = ["Apple", "Samsung", "Xiaomi", "Redmi", "POCO", "Huawei", "Honor", "Oppo", "realme", "Vivo", "TECNO", "Infinix", "General Mobile", "Reeder", "Nokia", "Motorola", "OnePlus", "Google", "Nothing", "TCL", "Omix", "Hiking", "Casper", "ZTE", "Alcatel"];

export function markaBul(ad: string, verilen?: string): string | undefined {
  if (verilen) {
    const v = MARKALAR.find((m) => duzle(m) === duzle(verilen));
    return v ?? verilen.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (/\biphone\b/i.test(ad)) return "Apple";
  const d = duzle(ad);
  const m = MARKALAR.find((x) => d.startsWith(duzle(x) + " ") || d.includes(" " + duzle(x) + " "));
  if (m === "Redmi" || m === "POCO") return "Xiaomi";
  return m;
}

// Başlıktan depolama ve RAM: "Galaxy S25 12 GB 256 GB" → ram 12, depolama 256. "iPhone 17 Pro 1TB" → 1024.
export function bellekBul(ad: string) {
  const degerler = [...ad.replace(",", ".").matchAll(/(\d+(?:\.\d+)?)\s*(TB|GB)\b/gi)].map((m) => (m[2].toUpperCase() === "TB" ? Number(m[1]) * 1024 : Number(m[1])));
  const depolama = degerler.filter((x) => x >= 32).sort((a, b) => b - a)[0];
  const ram = degerler.filter((x) => x <= 24).sort((a, b) => b - a)[0];
  return { depolama, ram };
}

// Model adı: marka, bellek ve renk/ek kelimeler atılır. Eşleştirme anahtarı = marka|model|depolama.
export function modelBul(ad: string, marka?: string) {
  let s = ad.split(/\s\d+(?:[.,]\d+)?\s*(?:GB|TB)\b/i)[0];             // ilk bellek ifadesinden sonrası genelde renk
  s = s.replace(/\b(akıllı|akilli|cep)\s+telefon(u)?\b/gi, "").replace(/\b(android|ios)\s+telefon\b/gi, "");
  if (marka) s = s.replace(new RegExp("^\\s*" + marka.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+", "i"), "");
  s = s.replace(/^\s*(apple|samsung|xiaomi)\s+/i, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.split(" ").map((w) => {
    if (/^iphone$/i.test(w)) return "iPhone";
    if (/^[a-z]{0,2}\d+[a-z]*$/i.test(w) || w.length <= 2) return w.toUpperCase();  // S25, A56, 5G, FE
    return w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w[0].toUpperCase() + w.slice(1);
  }).join(" ").replace(/\biPhone (\d+)E\b/, "iPhone $1e");
}

export function eslesmeAnahtari(marka: string, model: string, depolama?: number) {
  // Samsung katlanabilirlerde "Z" öneki mağazaya göre yazılıp yazılmıyor ("Galaxy Z Fold8" = "Galaxy Fold8").
  return [duzle(marka), duzle(model).replace(/\b5g\b/g, "5g").replace(/^galaxy z (fold|flip)/, "galaxy $1"), depolama ?? ""].join("|");
}

// Mağazanın ham özellik tablosu → bizim alanlar. Etiketler mağazadan mağazaya değişir; burada eş anlamlıları topluyoruz.
export function ozellikleriCevir(ham: Record<string, string>, baslik: string): Record<string, string | number | boolean> {
  const bul = (...anahtarlar: RegExp[]) => {
    for (const [k, v] of Object.entries(ham)) if (anahtarlar.some((a) => a.test(duzle(k)))) return v;
    return undefined;
  };
  const o: Record<string, string | number | boolean | undefined> = {};
  const b = bellekBul(baslik);
  o.depolama_gb = gbAl(bul(/dahili haf|depolama|hafiza kapasitesi/)) ?? b.depolama;
  o.ram_gb = gbAl(bul(/^ram|bellek kapasitesi/)) ?? b.ram;
  o.ekran_inc = sayiAl(bul(/ekran boyutu|ekran buyuklugu/));
  const tip = bul(/ekran teknolojisi|ekran tipi|panel/);
  o.ekran_tipi = tip ? (/oled|amoled/i.test(tip) ? (/amoled/i.test(tip) ? "AMOLED" : "OLED") : /lcd|ips/i.test(tip) ? "LCD" : tip.slice(0, 30)) : undefined;
  o.cozunurluk = bul(/cozunurluk/)?.replace(/\s*x\s*/i, " × ");
  o.arka_kamera_mp = sayiAl(bul(/arka kamera/));
  o.on_kamera_mp = sayiAl(bul(/on kamera/));
  o.batarya_mah = sayiAl(bul(/pil|batarya/)?.match(/\d{3,5}\s*mah/i)?.[0] ?? bul(/pil kapasitesi|batarya kapasitesi|pil omru/));
  const isl = bul(/^islemci$|islemci modeli|yonga|chipset/);
  o.islemci = isl ? isl.replace(/\s+/g, " ").replace(/\b\w+/g, (w) => (w.length > 3 ? w[0] + w.slice(1).toLowerCase() : w)) : undefined;
  const os = bul(/isletim sistemi/) ?? "";
  o.isletim_sistemi = /ios/i.test(os) || /iphone/i.test(baslik) ? "iOS" : /android/i.test(os) || os ? "Android" : undefined;
  const hucre = bul(/hucresel|sebeke|ag teknolojisi|5g/);
  o["5g"] = hucre ? /5g/i.test(hucre) : /\b5g\b/i.test(baslik) ? true : undefined;
  o.nfc = varMi(bul(/^nfc/));
  o.agirlik_g = sayiAl(bul(/agirlik/));
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && !(typeof v === "number" && !Number.isFinite(v)))) as Record<string, string | number | boolean>;
}
