// Kibar HTTP istemcisi: robots.txt'ye uyar, aynı siteye istekleri aralıklı yapar, kimliğini açıkça söyler.
// Bot koruması (CAPTCHA, meydan okuma sayfası) görürse aşmaya çalışmaz; "engellendi" diye raporlar.
import { KULLANICI_AJANI, izinliMi, robotsCoz, type Robots } from "./robots.ts";

const robotsOnbellek = new Map<string, Robots>();
const sonIstek = new Map<string, number>();

export type Yanit = { url: string; durum: number; html: string; engel?: string; sure: number };

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function robotsAl(site: string): Promise<Robots> {
  const kok = new URL(site).origin;
  const var_ = robotsOnbellek.get(kok);
  if (var_) return var_;
  try {
    const r = await fetch(kok + "/robots.txt", { headers: { "user-agent": KULLANICI_AJANI }, signal: AbortSignal.timeout(15000) });
    // Google'ın kuralı: robots.txt 4xx ise kısıtlama yok sayılır; 5xx ise site geçici olarak hiç taranmaz.
    const robots = r.ok ? robotsCoz(await r.text())
      : r.status < 500 ? { kurallar: [], siteHaritalari: [] }
      : { kurallar: [{ izin: false, yol: "/" }], siteHaritalari: [] };
    robotsOnbellek.set(kok, robots);
    return robots;
  } catch {
    const bos = { kurallar: [{ izin: false, yol: "/" }], siteHaritalari: [] }; // robots okunamazsa hiçbir şey okunmaz
    robotsOnbellek.set(kok, bos);
    return bos;
  }
}

function engelTespit(durum: number, html: string): string | undefined {
  if (durum === 403 || durum === 429 || durum === 503) return `HTTP ${durum}`;
  if (/captcha|cf-chl|challenge-platform|Attention Required|px-captcha|_Incapsula_|Access Denied|bot detected/i.test(html.slice(0, 20000)))
    return "bot koruması sayfası";
  return undefined;
}

export async function getir(url: string, enAzBekleme = 3000): Promise<Yanit> {
  const kok = new URL(url).origin;
  const robots = await robotsAl(url);
  if (!izinliMi(robots, url)) return { url, durum: 0, html: "", engel: "robots.txt izin vermiyor", sure: 0 };
  const gecikme = Math.max(enAzBekleme, (robots.gecikme ?? 0) * 1000);
  const once = sonIstek.get(kok) ?? 0;
  const kalan = once + gecikme - Date.now();
  if (kalan > 0) await bekle(kalan);
  sonIstek.set(kok, Date.now());
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      headers: { "user-agent": KULLANICI_AJANI, accept: "text/html,application/xhtml+xml,application/xml", "accept-language": "tr-TR,tr;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });
    const html = await r.text();
    return { url, durum: r.status, html, engel: engelTespit(r.status, html), sure: Date.now() - t0 };
  } catch (e) {
    return { url, durum: 0, html: "", engel: `bağlantı hatası: ${(e as Error).message}`, sure: Date.now() - t0 };
  }
}
