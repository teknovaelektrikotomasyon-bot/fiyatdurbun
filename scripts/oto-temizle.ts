// Otomatik eklenen mağazaların tekliflerini ve yalnız onlardan gelen ürünleri siler (yanlış kategori eşlemesinden sonra
// temiz bir başlangıç için). Elle tanımlı mağazaların verisine dokunmaz. Kullanım: node --experimental-strip-types scripts/oto-temizle.ts
import { q, kapat } from "../lib/db.ts";

const oto = "select id from magaza where kaynak='oto'";
const r1 = await q<{ n: number }>(`with d as (delete from fiyat_gecmisi where magaza_id in (${oto}) returning 1) select count(*)::int n from d`);
// Yalnız oto mağazalardan teklifi olan ürünler (silmeden önce belirlenir)
await q(`create temp table yetim as select distinct t.urun_id id from teklif t where t.magaza_id in (${oto}) and t.urun_id is not null
         and not exists (select 1 from teklif t2 where t2.urun_id=t.urun_id and t2.magaza_id not in (${oto}))`);
await q(`delete from eslesme_kuyrugu where teklif_id in (select id from teklif where magaza_id in (${oto}))`);
// Tıklanmış teklifler silinmez (tıklama kaydı korunur); ürünle bağı koparılıp stok dışı bırakılır, sonraki turda yeniden eşlenir.
await q(`update teklif set urun_id=null, stokta=false where magaza_id in (${oto}) and exists (select 1 from tiklama k where k.teklif_id=teklif.id)`);
const r2 = await q<{ n: number }>(`with d as (delete from teklif where magaza_id in (${oto}) and not exists (select 1 from tiklama k where k.teklif_id=teklif.id) returning 1) select count(*)::int n from d`);
let silinen = 0;
try {
  const r3 = await q<{ n: number }>(`with d as (delete from urun u using yetim y where u.id=y.id
      and not exists (select 1 from takip where urun_id=u.id) and not exists (select 1 from teklif where urun_id=u.id)
      and not exists (select 1 from bildirim where urun_id=u.id) and not exists (select 1 from eslesme_kuyrugu where oneri_urun=u.id) returning 1) select count(*)::int n from d`);
  silinen = r3[0].n;
} catch (e) { console.log("ürün silme atlandı:", (e as Error).message); }
console.log(`fiyat geçmişi ${r1[0].n}, teklif ${r2[0].n}, ürün ${silinen} silindi`);
await kapat();
