// Veritabanı teşhisi: sitenin ağır sorgularının süresi ve planı (EXPLAIN ANALYZE). Yalnızca okur.
import { q, kapat } from "../lib/db.ts";
import { enCokDusenler, populer, urunler, kategoriUrunSayilari } from "../lib/sorgular.ts";

// Kapsam: bir ürün kaç mağazada var (hedef: çok satan ürünlerde 10+).
console.log("ürün başına mağaza dağılımı", await q(`select n, count(*)::int urun from (select urun_id, count(distinct magaza_id)::int n from teklif where stokta and urun_id is not null group by urun_id) x group by n order by n`));
console.log("en çok mağazalı ürünler", await q(`select u.slug, count(distinct t.magaza_id)::int n from teklif t join urun u on u.id=t.urun_id where t.stokta group by u.slug order by n desc limit 15`));
console.log("mağaza başına teklif", await q(`select m.slug, m.kaynak, m.aktif, count(t.id)::int teklif from magaza m left join teklif t on t.magaza_id=m.id group by 1,2,3 order by teklif desc`));
const olc = async (ad: string, f: () => Promise<unknown>) => { const t = Date.now(); try { await f(); console.log(`${ad}: ${Date.now() - t} ms`); } catch (e) { console.log(`${ad}: HATA ${(e as Error).message} (${Date.now() - t} ms)`); } };
console.log(await q("select (select count(*) from urun) urun, (select count(*) from teklif) teklif, (select count(*) from fiyat_gecmisi) gecmis, (select count(*) from tiklama) tiklama"));
console.log(await q("select indexname, indexdef from pg_indexes where tablename in ('fiyat_gecmisi','teklif','urun','tiklama') order by 1"));
console.log(await q("select pid, state, now()-query_start as sure, left(query,120) q from pg_stat_activity where datname=current_database() and state <> 'idle' and pid <> pg_backend_pid()"));
await olc("enCokDusenler", () => enCokDusenler(8));
await olc("populer", () => populer(12));
await olc("kategoriUrunSayilari", () => kategoriUrunSayilari());
await olc("urunler telefon", async () => urunler([(await q<{ id: number }>("select id from kategori where slug='akilli-telefon'"))[0].id], {}, [], "fiyat", 49));
const plan = await q<{ "QUERY PLAN": string }>(`explain (analyze, buffers) select * from (
  with t as (select urun_id, min(fiyat)::float8 as fiyat from teklif where stokta group by urun_id),
  g as (select urun_id,
      (select min(f2.fiyat) from fiyat_gecmisi f2 where f2.urun_id = f.urun_id and f2.gun = (select min(gun) from fiyat_gecmisi f3 where f3.urun_id = f.urun_id and f3.gun >= current_date - 30)) as once30,
      (select max(dm) from (select min(f4.fiyat) as dm from fiyat_gecmisi f4 where f4.urun_id = f.urun_id and f4.gun >= current_date - 30 group by f4.gun) z) as en_yuksek30
    from fiyat_gecmisi f group by urun_id)
  select u.id from urun u left join t on t.urun_id=u.id left join g on g.urun_id=u.id) x`);
console.log(plan.map((p) => p["QUERY PLAN"]).join("\n"));
// İndirim sayfası tanısı: geçmiş kaç gün, kaç ürünün yeterli günü var, eşikler nasıl dağılıyor
console.log("geçmiş günleri:", await q("select min(gun)::text ilk, max(gun)::text son, count(distinct gun)::int gun, count(distinct urun_id)::int urun from fiyat_gecmisi"));
console.log("ürün başına gün sayısı:", await q(`select g, count(*)::int urun from (select urun_id, least(count(distinct gun), 31) g from fiyat_gecmisi where gun >= current_date-31 group by urun_id) x group by g order by g`));
console.log("indirim eşikleri:", await q(`with gunluk as (select urun_id, gun, min(fiyat)::float8 f from fiyat_gecmisi where gun >= current_date-31 group by urun_id, gun),
  s as (select urun_id, min(fiyat)::float8 fiyat from teklif where stokta and not supheli and urun_id is not null group by urun_id),
  i as (select urun_id, min(f) filter (where gun<current_date) min30, (percentile_cont(0.5) within group (order by f) filter (where gun<current_date))::float8 med30,
    max(f) filter (where gun>=current_date-14 and gun<current_date) max14, min(f) filter (where gun<current_date-14) eski, count(*) filter (where gun<current_date) n from gunluk group by urun_id)
  select count(*)::int toplam, count(*) filter (where n>=3)::int n3, count(*) filter (where n>=7)::int n7,
    count(*) filter (where n>=3 and fiyat<=min30)::int en_dusukte, count(*) filter (where n>=3 and fiyat<=min30 and fiyat<=med30*0.97)::int d3,
    count(*) filter (where n>=3 and fiyat<=min30 and fiyat<=med30*0.93)::int d7,
    count(*) filter (where max14 >= coalesce(eski, min30)*1.05 and fiyat <= max14*0.97)::int zam_sonra_dusus
  from i join s using (urun_id)`));
await kapat();
