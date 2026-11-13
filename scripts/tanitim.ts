// Mağazalara "ürünlerinizi ücretsiz listeleyelim" e-postası. Varsayılan kuru çalışma (göndermez, örnek basar).
// Kullanım: node --experimental-strip-types scripts/tanitim.ts --liste veri/iletisim.json [--gonder] [--limit 90]
// Her alan adına en çok bir kez gönderilir; listeden çıkanlara (ileti_ret) hiç gönderilmez. Kişisel adreslere gönderilmez.
import { readFileSync } from "node:fs";
import { q, kapat } from "../lib/db.ts";
import { epostaGonder } from "../lib/eposta.ts";
import { retImza, tanitimTablolari } from "../lib/tanitim.ts";

const arg = (ad: string) => { const i = process.argv.indexOf("--" + ad); return i > 0 ? process.argv[i + 1] : undefined; };
const gonder = process.argv.includes("--gonder");
const limit = Number(arg("limit") ?? 90);
const KIMDEN = "Fiyat Dürbün <magaza@fiyatdurbun.com>";
const YANIT = process.env.TANITIM_YANIT || "info@teknovaelektrik.com"; // mağazaların cevapları buraya gelir

const ham = JSON.parse(readFileSync(arg("liste") ?? "veri/iletisim.json", "utf8")) as { alan: string; eposta: string | null }[];
// Temizlik: HTML kaçışı kalıntısı (u003e), takip alt alan adları (info@t.site.com), şüpheli adresler; aynı firmanın ikinci alan adı.
const gorulenEposta = new Set<string>();
const liste = ham.map((s) => ({ ...s, eposta: s.eposta?.replace(/^u003e/, "") ?? null }))
  .filter((s) => s.eposta && !/@t\./.test(s.eposta) && !/^(shopify|ibilgi)@/.test(s.eposta))
  .filter((s) => { if (gorulenEposta.has(s.eposta!)) return false; gorulenEposta.add(s.eposta!); return true; });
await tanitimTablolari();
const listede = new Set((await q<{ site: string }>("select site from magaza where aktif")).map((r) => new URL(r.site).hostname.replace(/^www\./, "")));
const gonderilmis = new Set((await q<{ alan: string }>("select alan from magaza_tanitim where gonderim is not null")).map((r) => r.alan));
// Feed'i zaten okunan mağazalara e-posta gerekmez.
const feedli = new Set((await q<{ site: string }>("select site from magaza where kesif->>'feed' is not null")).map((r) => new URL(r.site).hostname.replace(/^www\./, "")));
const ret = new Set((await q<{ eposta: string }>("select eposta from ileti_ret")).map((r) => r.eposta));

const kac = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
function metin(alan: string, eposta: string) {
  const zatenVar = listede.has(alan);
  const ret_ = `https://fiyatdurbun.com/ileti-ret?e=${encodeURIComponent(eposta)}&t=${retImza(eposta)}`;
  const konu = zatenVar ? `${alan} ürünleri Fiyat Dürbün'de: fiyatlarınızı daha güncel gösterelim` : `${alan} ürünlerini Fiyat Dürbün'de ücretsiz listeleyelim`;
  const govde = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#102a3a;max-width:560px">
<p>Merhaba,</p>
<p><a href="https://fiyatdurbun.com">Fiyat Dürbün</a>, Türkiye'deki çevrim içi mağazaların fiyatlarını karşılaştıran, fiyat geçmişi ve fiyat alarmı sunan bir sitedir.
${zatenVar
  ? `<b>${kac(alan)}</b> ürünleri sitemizde zaten listeleniyor ve ziyaretçilerimizi doğrudan ürün sayfalarınıza yönlendiriyoruz. Fiyat ve stok bilgilerinizi daha güncel ve eksiksiz gösterebilmek için ürün XML'inizi kullanmak isteriz.`
  : `<b>${kac(alan)}</b> ürünlerini sitemizde <b>ücretsiz</b> listelemek ve ziyaretçilerimizi doğrudan ürün sayfalarınıza yönlendirmek istiyoruz.`}</p>
<p>Bunun için yapmanız gereken tek şey, fiyat karşılaştırma siteleri ya da Google alışveriş için kullandığınız <b>ürün XML (feed) adresini</b> bu e-postaya yanıt olarak göndermek
ya da <a href="https://fiyatdurbun.com/magazanizi-ekleyin">fiyatdurbun.com/magazanizi-ekleyin</a> sayfasından başvurmak. Ticimax, IdeaSoft, T-Soft, ikas gibi altyapılarda bu XML genelde hazırdır.</p>
<p>Listeleme ücretsizdir; komisyon ya da üyelik ücreti alınmaz.</p>
<p>İyi çalışmalar,<br>Fiyat Dürbün<br><a href="https://fiyatdurbun.com">fiyatdurbun.com</a></p>
<p style="font-size:12px;color:#566874;border-top:1px solid #d8e0e4;padding-top:10px;margin-top:20px">Bu e-postayı, sitenizde yayımlanan iletişim adresine işletmenize yönelik tek seferlik bir bilgilendirme olarak gönderdik.
Bir daha e-posta almak istemiyorsanız <a href="${ret_}">buraya tıklayın</a>.</p></div>`;
  return { konu, govde };
}

let n = 0;
for (const s of liste) {
  if (!s.eposta || gonderilmis.has(s.alan) || feedli.has(s.alan) || ret.has(s.eposta)) continue;
  if (n >= limit) break;
  const { konu, govde } = metin(s.alan, s.eposta);
  if (!gonder) { if (n < 2) console.log(`--- ${s.eposta}\nKonu: ${konu}\n${govde.replace(/<[^>]+>/g, "").replace(/\n+/g, "\n")}`); n++; continue; }
  try {
    await epostaGonder(s.eposta, konu, govde, { kimden: KIMDEN, yanit: YANIT || undefined });
    await q(`insert into magaza_tanitim (alan, eposta, gonderim, durum) values ($1,$2,now(),'gonderildi')
             on conflict (alan) do update set eposta=excluded.eposta, gonderim=now(), durum='gonderildi', hata=null`, [s.alan, s.eposta]);
    console.log("gönderildi", s.alan, s.eposta);
  } catch (e) {
    await q(`insert into magaza_tanitim (alan, eposta, durum, hata) values ($1,$2,'hata',$3) on conflict (alan) do update set durum='hata', hata=excluded.hata`, [s.alan, s.eposta, (e as Error).message.slice(0, 300)]);
    console.log("hata", s.alan, (e as Error).message.slice(0, 120));
  }
  n++;
  await new Promise((r) => setTimeout(r, 1200));
}
console.log(`${gonder ? "gönderilen" : "gönderilecek (kuru)"}: ${n}`);
await kapat();
