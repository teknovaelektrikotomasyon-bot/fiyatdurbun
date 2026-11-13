// Otomatik eklenen mağazaların tekliflerini ve hiçbir teklifi/geçmişi kalmayan (yetim) ürünleri siler (yanlış kategori eşlemesinden sonra
// temiz bir başlangıç için). Elle tanımlı mağazaların verisine dokunmaz. Kullanım: node --experimental-strip-types scripts/oto-temizle.ts
import { q, kapat } from "../lib/db.ts";

const oto = "select id from magaza where kaynak='oto'";
const r1 = await q<{ n: number }>(`with d as (delete from fiyat_gecmisi where magaza_id in (${oto}) returning 1) select count(*)::int n from d`);
await q(`delete from eslesme_kuyrugu where teklif_id in (select id from teklif where magaza_id in (${oto}))`);
// Tıklanmış teklifler silinmez (tıklama kaydı korunur); ürünle bağı koparılıp stok dışı bırakılır, sonraki turda yeniden eşlenir.
await q(`update teklif set urun_id=null, stokta=false where magaza_id in (${oto}) and exists (select 1 from tiklama k where k.teklif_id=teklif.id)`);
const r2 = await q<{ n: number }>(`with d as (delete from teklif where magaza_id in (${oto}) and not exists (select 1 from tiklama k where k.teklif_id=teklif.id) returning 1) select count(*)::int n from d`);
let silinen = 0;
try {
  const r3 = await q<{ n: number }>(`with d as (delete from urun u where not exists (select 1 from takip where urun_id=u.id) and not exists (select 1 from teklif where urun_id=u.id)
      and not exists (select 1 from bildirim where urun_id=u.id) and not exists (select 1 from eslesme_kuyrugu where oneri_urun=u.id)
      and not exists (select 1 from fiyat_gecmisi where urun_id=u.id) returning 1) select count(*)::int n from d`);
  silinen = r3[0].n;
} catch (e) { console.log("ürün silme atlandı:", (e as Error).message); }
console.log(`fiyat geçmişi ${r1[0].n}, teklif ${r2[0].n}, ürün ${silinen} silindi`);
await kapat();
