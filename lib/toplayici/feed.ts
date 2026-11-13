// Mağazaların herkese açık ürün feed'leri (Google Merchant / Cimri / Akakçe biçimli XML).
// Kurallar: robots.txt'nin izin verdiği adresler okunur; adresinde gizli anahtar (token, key, hash...) olan feed'ler
// mağazanın özel olarak paylaştığı linklerdir, okunmaz. Şifre ya da koruma aşılmaz.
import { KULLANICI_AJANI, izinliMi } from "./robots.ts";
import { robotsAl, getir } from "./istek.ts";
import { decode, eanGecerli, type OkunanTeklif } from "./okuyucu.ts";

/** Yaygın e-ticaret altyapılarının ve eklentilerinin feed yolları. */
export const FEED_YOLLARI = [
  "/cimri.xml", "/akakce.xml", "/google.xml", "/googlemerchant.xml", "/google-merchant.xml", "/merchant.xml",
  "/products.xml", "/urunler.xml", "/xml/cimri.xml", "/xml/akakce.xml", "/xml/google.xml", "/feed/google.xml",
  "/feeds/google.xml", "/export/cimri.xml",
];
const FEED_IPUCU = /(merchant|google|cimri|akakce|feed|urunler|products?\.xml|xmlexport|export)/i;
const GIZLI = /[?&](token|key|apikey|api_key|hash|secret|sig|signature|auth|k|pass(word)?)=/i;

export const gizliAnahtarli = (url: string) => GIZLI.test(url);

/** Feed'i indirir (büyük olabilir: uzun zaman aşımı). robots.txt izin vermiyorsa ya da gizli anahtarlıysa okumaz. */
export async function feedGetir(url: string, zamanAsimi = 180_000): Promise<{ xml: string; engel?: string }> {
  if (gizliAnahtarli(url)) return { xml: "", engel: "gizli anahtarlı adres" };
  const robots = await robotsAl(url);
  if (!izinliMi(robots, url)) return { xml: "", engel: "robots.txt izin vermiyor" };
  try {
    const r = await fetch(url, { headers: { "user-agent": KULLANICI_AJANI, accept: "application/xml,text/xml,*/*" }, redirect: "follow", signal: AbortSignal.timeout(zamanAsimi) });
    if (!r.ok) return { xml: "", engel: `HTTP ${r.status}` };
    return { xml: await r.text() };
  } catch (e) { return { xml: "", engel: (e as Error).message }; }
}

// --- Ayrıştırma ---------------------------------------------------------------------------------------------
const ALAN = {
  ad: ["title", "name", "urunadi", "urun_adi", "urunismi", "productname", "product_name", "baslik", "isim", "adi", "label"],
  indirimli: ["sale_price", "indirimli_fiyat", "indirimlifiyat", "salesprice", "sales_price", "discounted_price", "special_price", "satis_fiyati", "satisfiyati"],
  fiyat: ["price", "fiyat", "price_with_vat", "kdvli_fiyat", "fiyat_kdv_dahil", "product_price", "urunfiyati"],
  link: ["link", "url", "producturl", "product_url", "urunlinki", "urun_linki", "urun_url", "urunurl", "productlink"],
  gtin: ["gtin", "barcode", "barkod", "ean", "ean13", "gtin13"],
  mpn: ["mpn", "model", "modelkodu", "model_kodu"],
  sku: ["id", "sku", "stok_kodu", "stokkodu", "product_id", "productid", "urunkodu", "urun_kodu", "urunid", "code"],
  marka: ["brand", "marka", "manufacturer", "uretici"],
  gorsel: ["image_link", "image", "imageurl", "image_url", "resim", "resim1", "picture", "gorsel", "img", "image1"],
  kategori: ["product_type", "category", "categorytree", "category_tree", "kategori", "kategori_yolu", "kategoriyolu", "categorypath", "category_path", "google_product_category"],
  stok: ["availability", "stock", "stok", "quantity", "stok_adedi", "stokadedi", "stock_status", "instock", "in_stock"],
  kargo: ["kargo", "shipping_price", "kargo_ucreti", "kargoucreti", "shipping_cost"],
  para: ["currency", "para_birimi", "parabirimi"],
};

const bloklar = (xml: string, etiket: string) =>
  [...xml.matchAll(new RegExp(`<${etiket}(?:\\s[^>]*)?>([\\s\\S]*?)</${etiket}>`, "g"))].map((m) => m[1]);

/** Bir ürün bloğundaki doğrudan alanlar: g:price, price, <fiyat> ... (ad alanı önekleri atılır, küçük harf). */
function alanlar(blok: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of blok.matchAll(/<([A-Za-z_][\w.\-]*:)?([A-Za-z_][\w.\-]*)(?:\s[^>]*)?>([\s\S]*?)<\/\1?\2>/g)) {
    const ad = x[2].toLowerCase();
    let deger = x[3].trim();
    if (/^<!\[CDATA\[/.test(deger)) deger = deger.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1");
    else if (/<[a-z]/i.test(deger)) {
      // iç içe alan (g:shipping > g:price): yalnız kargo için alt fiyatı al
      if (ad === "shipping") { const f = deger.match(/<(?:g:)?price>([^<]+)</)?.[1]; if (f && !m.has("shipping_price")) m.set("shipping_price", f); }
      continue;
    }
    if (!m.has(ad)) m.set(ad, decode(deger).trim());
  }
  return m;
}

const ilk = (m: Map<string, string>, adlar: string[]) => { for (const a of adlar) { const v = m.get(a); if (v) return v; } return undefined; };

function sayi(v?: string): number | undefined {
  if (!v) return undefined;
  let s = v.replace(/[^\d.,]/g, "");
  if (!s) return undefined;
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function stokta(v?: string): boolean {
  if (v == null || v === "") return true;
  const s = v.toLowerCase().trim();
  if (/^\d+$/.test(s)) return Number(s) > 0;
  if (/(out.?of.?stock|tükendi|tukendi|stokta yok|yok|false|^0$|discontinued|preorder)/.test(s)) return false;
  return true;
}

/** Feed'i ayrıştırır. Yalnız mağazanın kendi alan adındaki, TL fiyatlı ürünler döner. */
export function feedOku(xml: string, kok: string): OkunanTeklif[] {
  const host = new URL(kok).hostname.replace(/^www\./, "");
  // Ürün etiketi: en çok tekrar eden aday
  const adaylar = ["item", "product", "urun", "Urun", "Product", "entry", "offer", "Item", "PRODUCT", "URUN"];
  let enIyi: string[] = [];
  for (const e of adaylar) { const b = bloklar(xml, e); if (b.length > enIyi.length) enIyi = b; }
  const sonuc: OkunanTeklif[] = [];
  for (const b of enIyi) {
    const m = alanlar(b);
    const ad = ilk(m, ALAN.ad);
    const link = ilk(m, ALAN.link);
    const fiyatHam = ilk(m, ALAN.indirimli) ?? ilk(m, ALAN.fiyat);
    const fiyat = sayi(fiyatHam);
    if (!ad || !link || !fiyat) continue;
    let url: URL;
    try { url = new URL(link, kok); } catch { continue; }
    if (url.hostname.replace(/^www\./, "") !== host) continue;
    const para = (ilk(m, ALAN.para) ?? fiyatHam!.match(/[A-Z]{3}/)?.[0] ?? (/(tl|₺)/i.test(fiyatHam!) ? "TRY" : "TRY")).toUpperCase().replace("TL", "TRY");
    const g = ilk(m, ALAN.gtin)?.replace(/\D/g, "");
    const kat = ilk(m, ALAN.kategori);
    const yol = kat?.split(/\s*(?:>|»|\/|\|)\s*/).map((s) => s.trim()).filter((s) => s && !/^(anasayfa|ana sayfa|home|tüm ürünler)$/i.test(s));
    const kargo = ilk(m, ALAN.kargo) ?? m.get("shipping_price");
    sonuc.push({
      url: url.toString().replace(/^http:/, "https:"), ad: ad.replace(/\s+/g, " ").trim(),
      marka: ilk(m, ALAN.marka), gtin: g && eanGecerli(g) ? g : undefined, mpn: ilk(m, ALAN.mpn), sku: ilk(m, ALAN.sku),
      fiyat, para, stokta: stokta(ilk(m, ALAN.stok)), kargo: kargo != null ? (sayi(kargo) ?? 0) : undefined,
      gorsel: ilk(m, ALAN.gorsel), kategoriYolu: yol && yol.length ? yol : undefined,
    });
  }
  return sonuc;
}

/** Mağazada feed arar: robots.txt'deki feed benzeri adresler + yaygın yollar. İlk geçerli (≥10 ürün) feed'i döner. */
export async function feedBul(kok: string, robotsHaritalari: string[] = []): Promise<{ url: string; urunler: OkunanTeklif[] } | null> {
  const adaylar = [
    ...robotsHaritalari.filter((u) => FEED_IPUCU.test(u) && !/sitemap/i.test(u)),
    ...FEED_YOLLARI.map((y) => new URL(y, kok).toString()),
  ].filter((u, i, a) => a.indexOf(u) === i && !gizliAnahtarli(u));
  for (const u of adaylar) {
    const y = await getir(u, 1500);
    if (y.engel || y.durum >= 400 || !y.html || !/^\s*(<\?xml|<rss|<feed|<urunler|<products|<root|<catalog)/i.test(y.html)) continue;
    const urunler = feedOku(y.html, kok);
    if (urunler.length >= 10) return { url: y.url, urunler };
  }
  return null;
}

/** Adres karşılaştırması için sade biçim (sorgu, çapa, sondaki / atılır). */
export const sadeAdres = (u: string) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/+$/, "").toLowerCase(); } catch { return u; } };
