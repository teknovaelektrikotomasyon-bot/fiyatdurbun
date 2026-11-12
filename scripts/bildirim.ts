// Takip bildirimleri: toplayıcıdan sonra çalışır. Takip edilen ürünün en ucuz fiyatı
//  - hedef yoksa: son bildirilen fiyattan en az %1 düşmüşse,
//  - hedef varsa: hedefin altına ilk kez inmişse
// üyeye e-posta gider. Fiyat yükselirse eşik yeni fiyata çekilir (sonraki düşüş yine haber verilir).
import { q, kapat } from "../lib/db.ts";
import { epostaGonder, siteAdresi } from "../lib/eposta.ts";
import { tl } from "../lib/sorgular.ts";

type Satir = { uye_id: number; eposta: string; urun_id: number; slug: string; ad: string; hedef: number | null; son: number | null; simdi: number; magaza: string; magaza_id: number; teklif_id: number };

const liste = await q<Satir>(`
  select tk.uye_id, u2.eposta, tk.urun_id, u.slug, mk.ad || ' ' || u.model || ' ' || coalesce(u.varyant,'') as ad,
    tk.hedef::float8 as hedef, tk.son_bildirilen::float8 as son, en.fiyat::float8 as simdi, en.magaza, en.magaza_id, en.teklif_id
  from takip tk join uye u2 on u2.id=tk.uye_id join urun u on u.id=tk.urun_id join marka mk on mk.id=u.marka_id
  join lateral (select t.fiyat, m.ad as magaza, m.id as magaza_id, t.id as teklif_id from teklif t join magaza m on m.id=t.magaza_id
                where t.urun_id=tk.urun_id and t.stokta and m.aktif and m.durum <> 'kapali' order by t.fiyat limit 1) en on true`);

let gonderilen = 0;
for (const s of liste) {
  const dustu = s.son == null || s.simdi <= s.son * 0.99;
  const hedefte = s.hedef != null && s.simdi <= s.hedef && (s.son == null || s.son > s.hedef);
  const bildir = s.hedef != null ? hedefte : dustu && s.son != null;
  if (!bildir) {
    if (s.son == null || s.simdi > s.son) await q("update takip set son_bildirilen=$3 where uye_id=$1 and urun_id=$2", [s.uye_id, s.urun_id, s.simdi]);
    continue;
  }
  const konu = s.hedef != null ? `${s.ad} hedef fiyatınızın altında: ${tl(s.simdi)}` : `${s.ad} ucuzladı: ${tl(s.simdi)}`;
  const link = `${siteAdresi()}/urun/${s.slug}`;
  let durum = "gonderildi";
  try {
    const r = await epostaGonder(s.eposta, konu, `<p><b>${s.ad}</b> şu an <b>${tl(s.simdi)}</b> (${s.magaza}).${s.son ? ` Önceki: ${tl(s.son)}.` : ""}</p>
      <p><a href="${link}">Tüm mağazaların fiyatını ve fiyat geçmişini görün</a></p>
      <p style="color:#5a6975;font-size:12px">Bu e-postayı ${s.ad} ürününü takip ettiğiniz için aldınız. Takibi ürün sayfasından ya da ${siteAdresi()}/hesabim adresinden bırakabilirsiniz.</p>`);
    if (!r.gonderildi) durum = "bekliyor";
  } catch (e) { durum = "hata"; console.error(e); }
  await q("insert into bildirim (uye_id, urun_id, eski, yeni, magaza_id, durum) values ($1,$2,$3,$4,$5,$6)", [s.uye_id, s.urun_id, s.son, s.simdi, s.magaza_id, durum]);
  await q("update takip set son_bildirilen=$3, son_bildirim=now() where uye_id=$1 and urun_id=$2", [s.uye_id, s.urun_id, s.simdi]);
  gonderilen++;
}
console.log(`${liste.length} takip incelendi, ${gonderilen} bildirim`);
await kapat();
