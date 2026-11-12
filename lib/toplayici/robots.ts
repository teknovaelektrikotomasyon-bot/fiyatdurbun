// robots.txt kurallarına uyum. Kural: izin verilmeyen hiçbir sayfa okunmaz.
export type RobotsKurali = { izin: boolean; yol: string };
export type Robots = { kurallar: RobotsKurali[]; gecikme?: number; siteHaritalari: string[] };

export const BOT_ADI = "FiyatDurbunBot";
export const KULLANICI_AJANI = `${BOT_ADI}/0.1 (+https://fiyatdurbun.com/bot)`;

export function robotsCoz(metin: string, ajan = BOT_ADI): Robots {
  const gruplar: { ajanlar: string[]; kurallar: RobotsKurali[]; gecikme?: number }[] = [];
  const siteHaritalari: string[] = [];
  let mevcut: (typeof gruplar)[number] | null = null;
  let sonSatirAjan = false;
  for (const ham of metin.split(/\r?\n/)) {
    const satir = ham.replace(/#.*$/, "").trim();
    if (!satir) continue;
    const i = satir.indexOf(":");
    if (i < 0) continue;
    const alan = satir.slice(0, i).trim().toLowerCase();
    const deger = satir.slice(i + 1).trim();
    if (alan === "sitemap") { siteHaritalari.push(deger); continue; }
    if (alan === "user-agent") {
      if (!mevcut || !sonSatirAjan) { mevcut = { ajanlar: [], kurallar: [] }; gruplar.push(mevcut); }
      mevcut.ajanlar.push(deger.toLowerCase());
      sonSatirAjan = true;
      continue;
    }
    sonSatirAjan = false;
    if (!mevcut) continue;
    if (alan === "disallow") { if (deger) mevcut.kurallar.push({ izin: false, yol: deger }); }
    else if (alan === "allow") mevcut.kurallar.push({ izin: true, yol: deger });
    else if (alan === "crawl-delay") mevcut.gecikme = Number(deger) || undefined;
  }
  const a = ajan.toLowerCase();
  const bize = gruplar.find((g) => g.ajanlar.some((x) => x !== "*" && a.includes(x)))
    ?? gruplar.find((g) => g.ajanlar.includes("*"));
  return { kurallar: bize?.kurallar ?? [], gecikme: bize?.gecikme, siteHaritalari };
}

// Google'ın tanımladığı eşleşme: * herhangi bir dizi, $ satır sonu; en uzun eşleşen kural kazanır, eşitlikte izin.
function desen(yol: string) {
  const son = yol.endsWith("$");
  const govde = (son ? yol.slice(0, -1) : yol).split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp("^" + govde + (son ? "$" : ""));
}

export function izinliMi(robots: Robots, url: string) {
  const u = new URL(url);
  const yol = u.pathname + u.search;
  let enIyi: RobotsKurali | null = null;
  for (const k of robots.kurallar) {
    if (!desen(k.yol).test(yol)) continue;
    if (!enIyi || k.yol.length > enIyi.yol.length || (k.yol.length === enIyi.yol.length && k.izin)) enIyi = k;
  }
  return enIyi ? enIyi.izin : true;
}
