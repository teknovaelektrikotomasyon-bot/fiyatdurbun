// Hangi mağazalar kendini tanıtan botumuza sunucudan kapı açıyor? Her sitede yalnız robots.txt + ana sayfa (1 istek).
import { KULLANICI_AJANI } from "../lib/toplayici/robots.ts";
const siteler = ["https://www.n11.com","https://www.amazon.com.tr","https://www.pazarama.com","https://www.turkcell.com.tr/pasaj","https://www.itopya.com","https://www.gurgencler.com.tr","https://www.incehesap.com","https://www.a101.com.tr","https://www.ciceksepeti.com","https://www.idefix.com","https://www.koctas.com.tr","https://www.boyner.com.tr","https://www.troyestore.com","https://www.sinerji.gen.tr","https://www.vatanbilgisayar.com/sitemap.xml","https://www.mediamarkt.com.tr/sitemaps/sitemap-index.xml"];
const satir: string[] = ["| Site | HTTP | KB | sunucu |","|---|---|---|---|"];
for (const s of siteler) {
  try {
    const r = await fetch(s, { headers: { "user-agent": KULLANICI_AJANI, "accept-language": "tr-TR" }, signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    satir.push(`| ${s} | ${r.status} | ${Math.round(t.length/1024)} | ${r.headers.get("server") ?? "-"} |`);
  } catch (e) { satir.push(`| ${s} | hata | - | ${(e as Error).message} |`); }
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(satir.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) (await import("node:fs")).appendFileSync(process.env.GITHUB_STEP_SUMMARY, satir.join("\n") + "\n");
