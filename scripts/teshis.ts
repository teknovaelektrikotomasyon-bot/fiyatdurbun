// Veritabanı teşhisi: sitenin ağır sorgularının süresi ve planı (EXPLAIN ANALYZE). Yalnızca okur.
import { q, kapat } from "../lib/db.ts";
import { enCokDusenler, populer, urunler, kategoriUrunSayilari } from "../lib/sorgular.ts";

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
await kapat();
